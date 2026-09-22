#!/bin/bash
# 管理端 API 全量测试 · 目标：生产服务器 8.136.34.95:8080
BASE="http://8.136.34.95:8080"
PASS=0; FAIL=0; FAILED_LIST=()

api() { # method path [json-body]
  local m=$1 p=$2 b=$3
  if [ -n "$b" ]; then
    curl -s -X "$m" "$BASE$p" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$b" --max-time 20
  else
    curl -s -X "$m" "$BASE$p" -H "Authorization: Bearer $TOKEN" --max-time 20
  fi
}
ok()   { PASS=$((PASS+1)); echo "  PASS  $1"; }
bad()  { FAIL=$((FAIL+1)); FAILED_LIST+=("$1"); echo "  FAIL  $1  ← $2"; }
check() { # name resp
  local name=$1 resp=$2
  if echo "$resp" | grep -q '"code":0'; then ok "$name"; else bad "$name" "$(echo "$resp" | head -c 160)"; fi
}

echo "===== 1. 鉴权 ====="
R=$(curl -s -X POST $BASE/api/v1/admin/login -H "Content-Type: application/json" -d '{"account":"admin","password":"tuge"}' --max-time 15)
TOKEN=$(echo "$R" | jq -r '.data.token // empty')
[ -n "$TOKEN" ] && ok "登录 admin/tuge" || bad "登录" "$R"
check "当前管理员信息 GET /admin/me" "$(api GET /api/v1/admin/me)"
R=$(curl -s -X POST $BASE/api/v1/admin/login -H "Content-Type: application/json" -d '{"account":"admin","password":"wrong"}' --max-time 10)
echo "$R" | grep -q '"code":401' && ok "错误密码正确拒绝" || bad "错误密码拒绝" "$R"
R=$(curl -s $BASE/api/v1/admin/boxes --max-time 10)
echo "$R" | grep -q '"code":40' && ok "无token访问被拦截" || bad "无token拦截" "$R"

echo "===== 2. 盲盒管理 ====="
R=$(api GET "/api/v1/admin/boxes?page=1&pageSize=5"); check "盲盒列表" "$R"
BOX_TOTAL=$(echo "$R" | jq -r '.data.total // 0')
FIRST_BOX_ID=$(echo "$R" | jq -r '.data.list[0].id // empty')
[ -n "$FIRST_BOX_ID" ] && check "盲盒线路池 GET /boxes/$FIRST_BOX_ID/pool" "$(api GET /api/v1/admin/boxes/$FIRST_BOX_ID/pool)" || echo "  SKIP  线路池（无盲盒数据）"
R=$(api POST /api/v1/admin/boxes '{"name":"测试盲盒-勿动","category":"nearby","tag":"测试","intro":"自动化测试临时数据","price":9.9,"minValue":8.8,"coverUrl":"","moods":["healing"],"sortWeight":999,"status":"off"}')
TB=$(echo "$R" | jq -r '.data.id // empty')
[ -n "$TB" ] && ok "创建盲盒 id=$TB" || bad "创建盲盒" "$R"
if [ -n "$TB" ]; then
  check "更新盲盒 PUT" "$(api PUT /api/v1/admin/boxes/$TB '{"name":"测试盲盒-勿动2","category":"nearby","tag":"测试","intro":"已更新","price":19.9,"minValue":8.8,"moods":["healing"],"sortWeight":999,"status":"off"}')"
  check "盲盒上架 PATCH status=on" "$(api PATCH /api/v1/admin/boxes/$TB/status '{"status":"on"}')"
  check "盲盒下架 PATCH status=off" "$(api PATCH /api/v1/admin/boxes/$TB/status '{"status":"off"}')"
  check "删除盲盒 DELETE" "$(api DELETE /api/v1/admin/boxes/$TB)"
  R=$(api GET "/api/v1/admin/boxes?page=1&pageSize=5")
  [ "$BOX_TOTAL" = "$(echo "$R" | jq -r '.data.total')" ] && ok "删除后总数复原($BOX_TOTAL)" || bad "删除后总数未复原" "$R"
fi

echo "===== 3. 线路管理 ====="
R=$(api GET "/api/v1/admin/routes?page=1&pageSize=5"); check "线路列表" "$R"
R=$(api POST /api/v1/admin/badges '{"name":"测试徽章-勿动","mark":"T","description":"自动化测试","sortWeight":999}')
TBADGE=$(echo "$R" | jq -r '.data.id // empty')
[ -n "$TBADGE" ] && ok "创建徽章(供线路用) id=$TBADGE" || bad "创建徽章" "$R"
if [ -n "$TBADGE" ]; then
  R=$(api POST /api/v1/admin/routes "{\"name\":\"测试线路-勿动\",\"category\":\"nearby\",\"destination\":\"测试地\",\"scene\":\"测试\",\"imageUrl\":\"\",\"value\":99.0,\"cost\":50.0,\"badgeId\":$TBADGE,\"highlight\":\"自动化测试\",\"includes\":[\"a\"],\"moodText\":\"测试\",\"status\":\"off\"}")
  TROUTE=$(echo "$R" | jq -r '.data.id // empty')
  [ -n "$TROUTE" ] && ok "创建线路 id=$TROUTE" || bad "创建线路" "$R"
  if [ -n "$TROUTE" ]; then
    check "更新线路 PUT" "$(api PUT /api/v1/admin/routes/$TROUTE "{\"name\":\"测试线路-勿动2\",\"category\":\"nearby\",\"destination\":\"测试地2\",\"value\":199.0,\"badgeId\":$TBADGE,\"highlight\":\"已更新\",\"moodText\":\"测试\",\"status\":\"off\"}")"
    check "线路上架 PATCH" "$(api PATCH /api/v1/admin/routes/$TROUTE/status '{"status":"on"}')"
    check "线路删除 DELETE" "$(api DELETE /api/v1/admin/routes/$TROUTE)"
  fi
fi

echo "===== 4. 徽章 / 轮播图 ====="
R=$(api GET "/api/v1/admin/badges?page=1&pageSize=5"); check "徽章列表" "$R"
if [ -n "$TBADGE" ]; then
  check "更新徽章 PUT" "$(api PUT /api/v1/admin/badges/$TBADGE '{"name":"测试徽章-勿动2","mark":"T","description":"已更新","sortWeight":998}')"
  check "删除徽章 DELETE" "$(api DELETE /api/v1/admin/badges/$TBADGE)"
fi
R=$(api GET "/api/v1/admin/banners?page=1&pageSize=5"); check "轮播图列表" "$R"
R=$(api POST /api/v1/admin/banners '{"title":"测试轮播-勿动","subTitle":"自动化测试","tag":"测试","imageUrl":"","jumpType":"none","jumpTarget":"","sortWeight":999,"status":"off"}')
TBAN=$(echo "$R" | jq -r '.data.id // empty')
[ -n "$TBAN" ] && ok "创建轮播图 id=$TBAN" || bad "创建轮播图" "$R"
if [ -n "$TBAN" ]; then
  check "更新轮播图 PUT" "$(api PUT /api/v1/admin/banners/$TBAN '{"title":"测试轮播-勿动2","subTitle":"已更新","tag":"测试","imageUrl":"","jumpType":"none","sortWeight":999,"status":"off"}')"
  check "轮播图状态 PATCH" "$(api PATCH /api/v1/admin/banners/$TBAN/status '{"status":"on"}')"
  check "删除轮播图 DELETE" "$(api DELETE /api/v1/admin/banners/$TBAN)"
fi

echo "===== 5. AI 配置 ====="
R=$(api GET /api/v1/admin/ai/config); check "AI 总配置读取" "$R"
GREET=$(echo "$R" | jq -r '.data.greet // empty'); SYSP=$(echo "$R" | jq -r '.data.systemPrompt // empty'); DIAP=$(echo "$R" | jq -r '.data.diaryPrompt // empty')
ENB=$(echo "$R" | jq -r '.data.enabled'); TENB=$(echo "$R" | jq -r '.data.toolsEnabled'); FENB=$(echo "$R" | jq -r '.data.fallbackEnabled')
JSON="{\"greet\":$(echo "$GREET" | jq -R .),\"systemPrompt\":$(echo "$SYSP" | jq -R .),\"diaryPrompt\":$(echo "$DIAP" | jq -R .),\"enabled\":$ENB,\"toolsEnabled\":$TENB,\"fallbackEnabled\":$FENB}"
check "AI 配置原样写回 PUT（不改内容）" "$(api PUT /api/v1/admin/ai/config "$JSON")"
for ep in quick-questions keyword-rules default-replies diary-templates; do
  check "AI $ep 列表" "$(api GET /api/v1/admin/ai/$ep)"
done
R=$(api POST /api/v1/admin/ai/quick-questions '{"text":"测试问题-勿动","sortWeight":999,"status":"off"}'); TQ=$(echo "$R" | jq -r '.data.id // empty')
[ -n "$TQ" ] && ok "AI 创建快捷问题 id=$TQ" || bad "AI 创建快捷问题" "$R"
if [ -n "$TQ" ]; then
  check "AI 更新快捷问题 PUT" "$(api PUT /api/v1/admin/ai/quick-questions/$TQ '{"text":"测试问题-勿动2","sortWeight":999,"status":"off"}')"
  check "AI 删除快捷问题 DELETE" "$(api DELETE /api/v1/admin/ai/quick-questions/$TQ)"
fi
R=$(api POST /api/v1/admin/ai/keyword-rules '{"keywords":["测试勿动"],"replyText":"自动化测试","sortWeight":999,"status":"off"}'); TK=$(echo "$R" | jq -r '.data.id // empty')
[ -n "$TK" ] && ok "AI 创建关键词规则 id=$TK" || bad "AI 创建关键词规则" "$R"
if [ -n "$TK" ]; then
  check "AI 更新关键词规则 PUT" "$(api PUT /api/v1/admin/ai/keyword-rules/$TK '{"keywords":["测试勿动2"],"replyText":"已更新","sortWeight":999,"status":"off"}')"
  check "AI 删除关键词规则 DELETE" "$(api DELETE /api/v1/admin/ai/keyword-rules/$TK)"
fi
R=$(api POST /api/v1/admin/ai/default-replies '{"text":"测试默认回复-勿动","sortWeight":999,"status":"off"}'); TD=$(echo "$R" | jq -r '.data.id // empty')
[ -n "$TD" ] && ok "AI 创建默认回复 id=$TD" || bad "AI 创建默认回复" "$R"
if [ -n "$TD" ]; then
  check "AI 更新默认回复 PUT" "$(api PUT /api/v1/admin/ai/default-replies/$TD '{"text":"已更新","sortWeight":999,"status":"off"}')"
  check "AI 删除默认回复 DELETE" "$(api DELETE /api/v1/admin/ai/default-replies/$TD)"
fi
R=$(api POST /api/v1/admin/ai/diary-templates '{"content":"测试日记模板-勿动","sortWeight":999,"status":"off"}'); TT=$(echo "$R" | jq -r '.data.id // empty')
[ -n "$TT" ] && ok "AI 创建日记模板 id=$TT" || bad "AI 创建日记模板" "$R"
if [ -n "$TT" ]; then
  check "AI 更新日记模板 PUT" "$(api PUT /api/v1/admin/ai/diary-templates/$TT '{"content":"已更新","sortWeight":999,"status":"off"}')"
  check "AI 删除日记模板 DELETE" "$(api DELETE /api/v1/admin/ai/diary-templates/$TT)"
fi

echo "===== 6. 人格问答 ====="
R=$(api GET /api/v1/admin/personality/questions); check "人格题目列表" "$R"
R=$(api GET /api/v1/admin/personality/results); check "人格结果列表" "$R"
R=$(api POST /api/v1/admin/personality/questions '{"seq":99,"stem":"测试题-勿动","status":"off"}'); TPQ=$(echo "$R" | jq -r '.data.id // empty')
[ -n "$TPQ" ] && ok "创建人格题目 id=$TPQ" || bad "创建人格题目" "$R"
if [ -n "$TPQ" ]; then
  R=$(api POST /api/v1/admin/personality/questions/$TPQ/options '{"seq":1,"label":"测试选项","scores":{"nature":1}}'); TPO=$(echo "$R" | jq -r '.data.id // empty')
  [ -n "$TPO" ] && ok "创建题目选项 id=$TPO" || bad "创建题目选项" "$R"
  [ -n "$TPO" ] && check "删除题目选项 DELETE" "$(api DELETE /api/v1/admin/personality/options/$TPO)"
  check "更新人格题目 PUT" "$(api PUT /api/v1/admin/personality/questions/$TPQ '{"seq":99,"stem":"测试题-勿动2","status":"off"}')"
  check "删除人格题目 DELETE" "$(api DELETE /api/v1/admin/personality/questions/$TPQ)"
fi
R=$(api POST /api/v1/admin/personality/results '{"type":"nature","name":"测试结果-勿动","mark":"测","description":"自动化测试","recommend":"测试"}'); TPR=$(echo "$R" | jq -r '.data.id // empty')
[ -n "$TPR" ] && ok "创建人格结果 id=$TPR" || bad "创建人格结果" "$R"
if [ -n "$TPR" ]; then
  check "更新人格结果 PUT" "$(api PUT /api/v1/admin/personality/results/$TPR '{"type":"nature","name":"测试结果-勿动2","mark":"测","description":"已更新","recommend":"测试"}')"
  check "删除人格结果 DELETE" "$(api DELETE /api/v1/admin/personality/results/$TPR)"
fi

echo "===== 7. 订单 / 退款 / 支付流水 / 行程 ====="
R=$(api GET "/api/v1/admin/orders?page=1&pageSize=5"); check "订单列表" "$R"
ORDER_NO=$(echo "$R" | jq -r '.data.list[0].orderNo // empty')
[ -n "$ORDER_NO" ] && check "订单详情 GET /orders/$ORDER_NO" "$(api GET /api/v1/admin/orders/$ORDER_NO)" || echo "  SKIP  订单详情（无订单）"
curl -s "$BASE/api/v1/admin/orders/export" -H "Authorization: Bearer $TOKEN" --max-time 30 -o /tmp/orders-export.csv
head -c 80 /tmp/orders-export.csv | grep -q -E "orderNo|订单" && ok "订单导出 CSV" || bad "订单导出 CSV" "$(head -c 100 /tmp/orders-export.csv)"
R=$(api GET "/api/v1/admin/refunds?page=1&pageSize=5"); check "退款列表" "$R"
REFUND_NO=$(echo "$R" | jq -r '.data.list[0].refundNo // empty')
[ -n "$REFUND_NO" ] && check "退款详情 GET /refunds/$REFUND_NO" "$(api GET /api/v1/admin/refunds/$REFUND_NO)" || echo "  SKIP  退款详情（无退款单）"
R=$(api POST /api/v1/admin/refunds/NO_SUCH_REFUND/approve)
echo "$R" | jq -e '.code' >/dev/null 2>&1 && [ "$(echo "$R" | jq -r '.code')" != "500" ] && ok "退款审核接口连通（不存在单号→业务报错）" || bad "退款审核接口" "$R"
R=$(api GET "/api/v1/admin/pay-flows?page=1&pageSize=5"); check "支付流水列表" "$R"
R=$(api GET "/api/v1/admin/trips?page=1&pageSize=5"); check "行程列表" "$R"
R=$(api POST /api/v1/admin/orders/NO_SUCH_ORDER/reopen)
echo "$R" | jq -e '.code' >/dev/null 2>&1 && [ "$(echo "$R" | jq -r '.code')" != "500" ] && ok "订单重开接口连通（不存在单号→业务报错）" || bad "订单重开接口" "$R"

echo "===== 8. 用户管理 ====="
R=$(api GET "/api/v1/admin/users?page=1&pageSize=5"); check "用户列表" "$R"
USER_ID=$(echo "$R" | jq -r '.data.list[0].id // empty')
if [ -n "$USER_ID" ]; then
  check "用户详情 GET /users/$USER_ID" "$(api GET /api/v1/admin/users/$USER_ID)"
  ORIG_NOTE=$(api GET /api/v1/admin/users/$USER_ID | jq -r '.data.csNote // ""')
  check "用户备注写入 PATCH note" "$(api PATCH /api/v1/admin/users/$USER_ID/note "{\"note\":\"自动化测试备注\"}")"
  check "用户备注还原 PATCH note" "$(api PATCH /api/v1/admin/users/$USER_ID/note "{\"note\":$(echo "$ORIG_NOTE" | jq -R .)}")"
else echo "  SKIP  用户详情（无用户）"; fi
curl -s "$BASE/api/v1/admin/users/export" -H "Authorization: Bearer $TOKEN" --max-time 30 -o /tmp/users-export.csv
head -c 80 /tmp/users-export.csv | grep -q -E "手机|phone|昵称" && ok "用户导出 CSV" || bad "用户导出 CSV" "$(head -c 100 /tmp/users-export.csv)"

echo "===== 9. 统计 ====="
QS="?begin=2026-09-01&end=2026-09-22"
check "用户统计 GET /stats/users" "$(api GET /api/v1/admin/stats/users$QS)"
check "支付统计 GET /stats/pay" "$(api GET /api/v1/admin/stats/pay$QS)"
check "内容统计 GET /stats/content" "$(api GET /api/v1/admin/stats/content$QS)"

echo "===== 10. 社区 ====="
R=$(api GET "/api/v1/admin/community/posts?page=1&pageSize=5"); check "社区帖子列表" "$R"
POST_ID=$(echo "$R" | jq -r '.data.list[0].id // empty')
[ -n "$POST_ID" ] && check "帖子详情 GET /community/posts/$POST_ID" "$(api GET /api/v1/admin/community/posts/$POST_ID)" || echo "  SKIP  帖子详情（无帖子）"
check "社区评论列表" "$(api GET "/api/v1/admin/community/comments?page=1&pageSize=5")"
R=$(api GET "/api/v1/admin/community/topics?page=1&pageSize=5"); check "社区话题列表" "$R"
R=$(api POST /api/v1/admin/community/topics '{"name":"测试话题-勿动","description":"自动化测试","heatWeight":0,"sortWeight":999,"status":"off"}'); TTOPIC=$(echo "$R" | jq -r '.data.id // empty')
[ -n "$TTOPIC" ] && ok "创建话题 id=$TTOPIC" || bad "创建话题" "$R"
if [ -n "$TTOPIC" ]; then
  check "更新话题 PUT" "$(api PUT /api/v1/admin/community/topics/$TTOPIC '{"name":"测试话题-勿动2","description":"已更新","heatWeight":0,"sortWeight":999,"status":"off"}')"
  check "删除话题 DELETE" "$(api DELETE /api/v1/admin/community/topics/$TTOPIC)"
fi

echo "===== 11. 打卡 ====="
check "打卡列表" "$(api GET "/api/v1/admin/checkins?page=1&pageSize=5")"
check "打卡统计" "$(api GET /api/v1/admin/checkins/statistics)"
R=$(api GET "/api/v1/admin/checkins?page=1&pageSize=5"); CID=$(echo "$R" | jq -r '.data.list[0].id // empty')
[ -n "$CID" ] && check "打卡详情 GET /checkins/$CID" "$(api GET /api/v1/admin/checkins/$CID)" || echo "  SKIP  打卡详情（无打卡数据）"

echo "===== 12. 成就 ====="
check "成就列表" "$(api GET "/api/v1/admin/achievements?page=1&pageSize=5")"
check "成就统计" "$(api GET /api/v1/admin/achievements/statistics)"
R=$(api POST /api/v1/admin/achievements '{"code":"TEST_AUTO","name":"测试成就-勿动","description":"自动化测试","requirementType":"trip_count","requirementValue":999,"level":1,"sortWeight":999,"status":"off"}'); TACH=$(echo "$R" | jq -r '.data.id // empty')
[ -n "$TACH" ] && ok "创建成就 id=$TACH" || bad "创建成就" "$R"
if [ -n "$TACH" ]; then
  check "更新成就 PUT" "$(api PUT /api/v1/admin/achievements/$TACH '{"code":"TEST_AUTO","name":"测试成就-勿动2","description":"已更新","requirementType":"trip_count","requirementValue":999,"level":1,"sortWeight":999,"status":"off"}')"
  check "删除成就 DELETE" "$(api DELETE /api/v1/admin/achievements/$TACH)"
fi

echo "===== 13. 图片上传（管理端 token） ====="
python3 -c "
import struct,zlib
def chunk(t,d):
    c=t+d; return struct.pack('>I',len(d))+c+struct.pack('>I',zlib.crc32(c)&0xffffffff)
ihdr=chunk(b'IHDR',struct.pack('>IIBBBBB',1,1,8,0,0,0,0))
idat=chunk(b'IDAT',zlib.compress(b'\x00\x8a\x00\x00'))
open('/tmp/test-upload.png','wb').write(b'\x89PNG\r\n\x1a\n'+ihdr+idat+chunk(b'IEND',b''))
"
R=$(curl -s -X POST "$BASE/api/v1/upload/image" -H "Authorization: Bearer $TOKEN" -F "file=@/tmp/test-upload.png;type=image/png" --max-time 20)
UPURL=$(echo "$R" | jq -r '.data.url // empty')
[ -n "$UPURL" ] && ok "图片上传成功 url=$UPURL" || bad "图片上传" "$R"
echo "test" > /tmp/test-upload.txt
R=$(curl -s -X POST "$BASE/api/v1/upload/image" -H "Authorization: Bearer $TOKEN" -F "file=@/tmp/test-upload.txt;type=text/plain" --max-time 20)
echo "$R" | jq -e '.code != 0' >/dev/null 2>&1 && ok "非图片文件正确拒绝" || bad "非图片拒绝" "$R"

echo ""
echo "=========================================="
echo "总计: PASS=$PASS  FAIL=$FAIL"
if [ $FAIL -gt 0 ]; then printf '失败项: %s\n' "${FAILED_LIST[@]}"; fi
