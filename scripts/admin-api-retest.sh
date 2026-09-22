#!/bin/bash
# 复测：修正首轮测试脚本自身的错误（字段名/JSON转义/合法枚举值）
BASE="http://8.136.34.95:8080"
PASS=0; FAIL=0; FAILED_LIST=()
api() { local m=$1 p=$2 b=$3
  if [ -n "$b" ]; then curl -s -X "$m" "$BASE$p" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data-binary @"$b" --max-time 20
  else curl -s -X "$m" "$BASE$p" -H "Authorization: Bearer $TOKEN" --max-time 20; fi }
ok()  { PASS=$((PASS+1)); echo "  PASS  $1"; }
bad() { FAIL=$((FAIL+1)); FAILED_LIST+=("$1"); echo "  FAIL  $1  ← $2"; }
check(){ if echo "$2" | grep -q '"code":0'; then ok "$1"; else bad "$1" "$(echo "$2" | head -c 200)"; fi }

TOKEN=$(curl -s -X POST $BASE/api/v1/admin/login -H "Content-Type: application/json" -d '{"account":"admin","password":"tuge"}' | jq -r '.data.token')

echo "===== 复测1: 盲盒全生命周期（mood=happy） ====="
cat > /tmp/b1.json <<'EOF'
{"name":"测试盲盒-勿动","category":"nearby","tag":"测试","intro":"自动化测试临时数据","price":9.9,"minValue":8.8,"coverUrl":"","moods":["happy"],"sortWeight":999,"status":"off"}
EOF
R=$(api POST /api/v1/admin/boxes /tmp/b1.json); TB=$(echo "$R" | jq -r '.data.id // empty')
[ -n "$TB" ] && ok "创建盲盒 id=$TB" || bad "创建盲盒" "$R"
if [ -n "$TB" ]; then
  cat > /tmp/b2.json <<EOF
{"name":"测试盲盒-勿动2","category":"nearby","tag":"测试","intro":"已更新","price":19.9,"minValue":8.8,"moods":["happy","curious"],"sortWeight":999,"status":"off","version":0}
EOF
  check "更新盲盒 PUT" "$(api PUT /api/v1/admin/boxes/$TB /tmp/b2.json)"
  check "盲盒上架" "$(api PATCH /api/v1/admin/boxes/$TB/status <(echo '{"status":"on"}'))"
  check "盲盒下架" "$(api PATCH /api/v1/admin/boxes/$TB/status <(echo '{"status":"off"}'))"
  check "删除盲盒" "$(api DELETE /api/v1/admin/boxes/$TB)"
fi

echo "===== 复测2: 线路更新（JSON 文件传输排除转义问题） ====="
cat > /tmp/badge.json <<'EOF'
{"name":"测试徽章-勿动B","mark":"测","description":"自动化测试","sortWeight":999}
EOF
R=$(api POST /api/v1/admin/badges /tmp/badge.json); TBADGE=$(echo "$R" | jq -r '.data.id // empty')
[ -n "$TBADGE" ] && ok "创建徽章B id=$TBADGE" || bad "创建徽章B" "$R"
if [ -n "$TBADGE" ]; then
  cat > /tmp/route1.json <<EOF
{"name":"测试线路-勿动","category":"nearby","destination":"测试地","scene":"测试","imageUrl":"","value":99.0,"cost":50.0,"badgeId":$TBADGE,"highlight":"自动化测试","includes":["测试"],"moodText":"测试","status":"off"}
EOF
  R=$(api POST /api/v1/admin/routes /tmp/route1.json); TROUTE=$(echo "$R" | jq -r '.data.id // empty')
  [ -n "$TROUTE" ] && ok "创建线路 id=$TROUTE" || bad "创建线路" "$R"
  if [ -n "$TROUTE" ]; then
    cat > /tmp/route2.json <<EOF
{"name":"测试线路-勿动2","category":"nearby","destination":"测试地2","value":199.0,"badgeId":$TBADGE,"highlight":"已更新","moodText":"测试","status":"off"}
EOF
    R=$(api PUT /api/v1/admin/routes/$TROUTE /tmp/route2.json)
    check "更新线路 PUT" "$R"
    [ -z "$(echo "$R" | jq -r '.data.id // empty')" ] && bad "更新线路返回体" "$R"
    check "线路上架" "$(api PATCH /api/v1/admin/routes/$TROUTE/status <(echo '{"status":"on"}'))"
    R=$(api DELETE /api/v1/admin/routes/$TROUTE); check "删除线路" "$R"
  fi
fi

echo "===== 复测3: AI 配置写回（jq -Rs 正确转义多行） ====="
R=$(api GET /api/v1/admin/ai/config)
jq -n --arg g "$(echo "$R" | jq -r '.data.greet')" --arg s "$(echo "$R" | jq -r '.data.systemPrompt')" --arg d "$(echo "$R" | jq -r '.data.diaryPrompt')" --argjson e "$(echo "$R" | jq '.data.enabled')" --argjson t "$(echo "$R" | jq '.data.toolsEnabled')" --argjson f "$(echo "$R" | jq '.data.fallbackEnabled')" '{greet:$g,systemPrompt:$s,diaryPrompt:$d,enabled:$e,toolsEnabled:$t,fallbackEnabled:$f}' > /tmp/aiconfig.json
check "AI 配置原样写回 PUT" "$(api PUT /api/v1/admin/ai/config /tmp/aiconfig.json)"
R2=$(api GET /api/v1/admin/ai/config)
[ "$(echo "$R" | jq -r '.data.systemPrompt')" = "$(echo "$R2" | jq -r '.data.systemPrompt')" ] && ok "AI 配置内容未变" || bad "AI 配置内容被改动" "$R2"

echo "===== 复测4: 题目选项（score 字段） ====="
cat > /tmp/pq.json <<'EOF'
{"seq":98,"stem":"测试题B-勿动","status":"off"}
EOF
R=$(api POST /api/v1/admin/personality/questions /tmp/pq.json); TPQ=$(echo "$R" | jq -r '.data.id // empty')
[ -n "$TPQ" ] && ok "创建题目B id=$TPQ" || bad "创建题目B" "$R"
if [ -n "$TPQ" ]; then
  cat > /tmp/po.json <<EOF
{"seq":1,"label":"测试选项B","score":{"nature":1}}
EOF
  R=$(api POST /api/v1/admin/personality/questions/$TPQ/options /tmp/po.json); TPO=$(echo "$R" | jq -r '.data.id // empty')
  [ -n "$TPO" ] && ok "创建选项 id=$TPO" || bad "创建选项" "$R"
  echo "NOTE 题目B/选项留待DB清理: question=$TPQ option=$TPO"
fi

echo "===== 复测5: 帖子详情/状态（postId 字段） ====="
R=$(api GET "/api/v1/admin/community/posts?page=1&pageSize=5")
PID=$(echo "$R" | jq -r '[.data.list[] | select(.status=="published")][0].postId // empty')
if [ -n "$PID" ]; then
  R=$(api GET /api/v1/admin/community/posts/$PID); check "帖子详情 GET posts/$PID" "$R"
  VER=$(echo "$R" | jq -r '.data.version // 0')
  cat > /tmp/poststatus.json <<EOF
{"toStatus":"down","reason":"自动化测试-稍后还原","version":$VER}
EOF
  R=$(api PATCH /api/v1/admin/community/posts/$PID/status /tmp/poststatus.json); check "帖子下架 PATCH" "$R"
  VER2=$(echo "$R" | jq -r '.data.version // 0')
  cat > /tmp/poststatus2.json <<EOF
{"toStatus":"published","reason":"自动化测试还原","version":$VER2}
EOF
  R=$(api PATCH /api/v1/admin/community/posts/$PID/status /tmp/poststatus2.json)
  check "帖子恢复 published" "$R"
  echo "$R" | jq -e '.data.status=="published"' >/dev/null && ok "帖子最终状态=已发布" || bad "帖子最终状态" "$R"
else echo "  SKIP  无 published 帖子"; fi

echo "===== 复测6: 评论状态（如有评论） ====="
R=$(api GET "/api/v1/admin/community/comments?page=1&pageSize=5")
CMT_TOTAL=$(echo "$R" | jq -r '.data.total // 0')
CID=$(echo "$R" | jq -r '[.data.list[] | select(.status=="published")][0].commentId // empty')
if [ -n "$CID" ]; then
  VER=$(echo "$R" | jq -r --argjson id "$CID" '[.data.list[] | select(.commentId==$id)][0].version // 0')
  cat > /tmp/cmt.json <<EOF
{"toStatus":"hidden","reason":"自动化测试-稍后还原","version":$VER}
EOF
  R=$(api PATCH /api/v1/admin/community/comments/$CID/status /tmp/cmt.json); check "评论隐藏 PATCH" "$R"
  cat > /tmp/cmt2.json <<EOF
{"toStatus":"published","reason":"自动化测试还原"}
EOF
  check "评论恢复 published" "$(api PATCH /api/v1/admin/community/comments/$CID/status /tmp/cmt2.json)"
else echo "  SKIP  无评论（total=$CMT_TOTAL）"; fi

echo "===== 复测7: 打卡详情/状态（checkinId 字段） ====="
R=$(api GET "/api/v1/admin/checkins?page=1&pageSize=5")
KID=$(echo "$R" | jq -r '[.data.list[] | select(.status=="published")][0].checkinId // empty')
if [ -n "$KID" ]; then
  check "打卡详情 GET checkins/$KID" "$(api GET /api/v1/admin/checkins/$KID)"
  cat > /tmp/ck.json <<'EOF'
{"toStatus":"hidden","reason":"自动化测试-稍后还原"}
EOF
  R=$(api PATCH /api/v1/admin/checkins/$KID/status /tmp/ck.json); check "打卡隐藏 PATCH" "$R"
  cat > /tmp/ck2.json <<'EOF'
{"toStatus":"published","reason":"自动化测试还原"}
EOF
  R=$(api PATCH /api/v1/admin/checkins/$KID/status /tmp/ck2.json)
  check "打卡恢复 published" "$R"
  echo "$R" | jq -e '.data.status=="published"' >/dev/null && ok "打卡最终状态=已发布" || bad "打卡最终状态" "$R"
else echo "  SKIP  无 published 打卡"; fi

echo "===== 复测8: 用户状态接口校验（不实际禁用真人） ====="
R=$(api PATCH /api/v1/admin/users/10071/status <(echo '{"status":"bogus_value"}'))
echo "$R" | jq -e '.code != 0' >/dev/null 2>&1 && ok "非法状态值被拒绝（接口连通+校验生效）" || bad "用户状态校验" "$R"

echo "===== 复测9: 话题/成就生命周期（正确字段名） ====="
R=$(api GET "/api/v1/admin/community/topics?page=1&pageSize=50")
TTOPIC=$(echo "$R" | jq -r '[.data.list[] | select(.name=="测试话题-勿动")][0].topicId // empty')
if [ -n "$TTOPIC" ]; then
  cat > /tmp/topic.json <<'EOF'
{"name":"测试话题-勿动","description":"已更新","sortWeight":999,"status":"off"}
EOF
  check "更新话题 PUT" "$(api PUT /api/v1/admin/community/topics/$TTOPIC /tmp/topic.json)"
  check "删除话题 DELETE" "$(api DELETE /api/v1/admin/community/topics/$TTOPIC)"
else echo "  NOTE  未找到话题7，跳过"; fi
R=$(api GET "/api/v1/admin/achievements?page=1&pageSize=50")
TACH=$(echo "$R" | jq -r '[.data.list[] | select(.code=="TEST_AUTO")][0].achievementId // empty')
[ -n "$TACH" ] && { check "成就下架(删除=下架) DELETE" "$(api DELETE /api/v1/admin/achievements/$TACH)"; echo "NOTE  成就$TACH为软下架，稍后DB硬删"; } || echo "  NOTE  未找到TEST_AUTO成就"

echo ""
echo "=========================================="
echo "复测总计: PASS=$PASS  FAIL=$FAIL"
if [ $FAIL -gt 0 ]; then printf '失败项: %s\n' "${FAILED_LIST[@]}"; fi
