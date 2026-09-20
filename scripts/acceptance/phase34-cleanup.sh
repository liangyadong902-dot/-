#!/bin/zsh
set -euo pipefail

: "${ACCEPTANCE_RUN_ID:?Set ACCEPTANCE_RUN_ID to the 7-digit run id printed by the acceptance script}"
: "${ACCEPTANCE_DB_PASSWORD:?Set ACCEPTANCE_DB_PASSWORD for the local acceptance database}"

if [[ ! "$ACCEPTANCE_RUN_ID" =~ '^[0-9]{7}$' ]]; then
  echo "ACCEPTANCE_RUN_ID must contain exactly 7 digits" >&2
  exit 2
fi

acceptance_db_name="${ACCEPTANCE_DB_NAME:-tuge_acceptance}"
if [[ "$acceptance_db_name" != "tuge_acceptance" ]]; then
  echo "Refusing cleanup outside tuge_acceptance" >&2
  exit 2
fi

acceptance_db_host="${ACCEPTANCE_DB_HOST:-127.0.0.1}"
acceptance_db_port="${ACCEPTANCE_DB_PORT:-3306}"
acceptance_mysql_bin="${ACCEPTANCE_MYSQL_BIN:-mysql}"

acceptance_user_ids="$({
  MYSQL_PWD="$ACCEPTANCE_DB_PASSWORD" "$acceptance_mysql_bin" \
    --protocol=TCP \
    -h"$acceptance_db_host" \
    -P"$acceptance_db_port" \
    -uroot \
    -N \
    "$acceptance_db_name" \
    -e "SELECT id FROM app_user WHERE phone IN ('1888${ACCEPTANCE_RUN_ID}','1898${ACCEPTANCE_RUN_ID}','1878${ACCEPTANCE_RUN_ID}','1868${ACCEPTANCE_RUN_ID}')"
} | tr '\n' ' ')"

MYSQL_PWD="$ACCEPTANCE_DB_PASSWORD" "$acceptance_mysql_bin" \
  --protocol=TCP \
  -h"$acceptance_db_host" \
  -P"$acceptance_db_port" \
  -uroot \
  "$acceptance_db_name" <<SQL
START TRANSACTION;
SET @acceptance_run_id = '${ACCEPTANCE_RUN_ID}';

CREATE TEMPORARY TABLE acceptance_users (id BIGINT UNSIGNED PRIMARY KEY);
INSERT INTO acceptance_users (id)
SELECT id FROM app_user
WHERE phone IN (
  CONCAT('1888', @acceptance_run_id),
  CONCAT('1898', @acceptance_run_id),
  CONCAT('1878', @acceptance_run_id),
  CONCAT('1868', @acceptance_run_id)
);

CREATE TEMPORARY TABLE acceptance_orders (id BIGINT UNSIGNED PRIMARY KEY);
INSERT INTO acceptance_orders (id)
SELECT id FROM biz_order WHERE user_id IN (SELECT id FROM acceptance_users);

CREATE TEMPORARY TABLE acceptance_trips (id BIGINT UNSIGNED PRIMARY KEY);
INSERT INTO acceptance_trips (id)
SELECT id FROM trip WHERE user_id IN (SELECT id FROM acceptance_users);

DELETE FROM admin_audit_log
WHERE target_id IN (SELECT CAST(id AS CHAR) FROM acceptance_users)
   OR CAST(detail_json AS CHAR) LIKE CONCAT('%', @acceptance_run_id, '%');
DELETE FROM payment_flow WHERE order_id IN (SELECT id FROM acceptance_orders);
DELETE FROM refund_order
WHERE user_id IN (SELECT id FROM acceptance_users)
   OR order_id IN (SELECT id FROM acceptance_orders);
DELETE FROM user_coupon
WHERE user_id IN (SELECT id FROM acceptance_users)
   OR order_id IN (SELECT id FROM acceptance_orders);
DELETE FROM user_badge
WHERE user_id IN (SELECT id FROM acceptance_users)
   OR source_trip_id IN (SELECT id FROM acceptance_trips);
DELETE FROM checkin_like WHERE user_id IN (SELECT id FROM acceptance_users);
DELETE FROM checkin WHERE user_id IN (SELECT id FROM acceptance_users);
DELETE FROM post_interaction WHERE user_id IN (SELECT id FROM acceptance_users);
DELETE FROM community_post WHERE user_id IN (SELECT id FROM acceptance_users);
DELETE FROM chat_message WHERE user_id IN (SELECT id FROM acceptance_users);
DELETE FROM personality_test WHERE user_id IN (SELECT id FROM acceptance_users);
DELETE FROM mood_log WHERE user_id IN (SELECT id FROM acceptance_users);
DELETE FROM point_log WHERE user_id IN (SELECT id FROM acceptance_users);
DELETE FROM user_achievement WHERE user_id IN (SELECT id FROM acceptance_users);
DELETE FROM user_ai_memory WHERE user_id IN (SELECT id FROM acceptance_users);
DELETE FROM user_point WHERE user_id IN (SELECT id FROM acceptance_users);
DELETE FROM user_topic_follow WHERE user_id IN (SELECT id FROM acceptance_users);
DELETE FROM trip WHERE id IN (SELECT id FROM acceptance_trips);
DELETE FROM biz_order WHERE id IN (SELECT id FROM acceptance_orders);
DELETE FROM app_user WHERE id IN (SELECT id FROM acceptance_users);

COMMIT;
SQL

if [[ "${ACCEPTANCE_RESET_SEED_DIARY:-false}" == "true" ]]; then
  MYSQL_PWD="$ACCEPTANCE_DB_PASSWORD" "$acceptance_mysql_bin" \
    --protocol=TCP \
    -h"$acceptance_db_host" \
    -P"$acceptance_db_port" \
    -uroot \
    "$acceptance_db_name" \
    -e "UPDATE trip SET diary_text=NULL, diary_at=NULL WHERE id=1 AND user_id=10021"
fi

acceptance_redis_cli="${ACCEPTANCE_REDIS_CLI:-}"
if [[ -n "$acceptance_redis_cli" && -x "$acceptance_redis_cli" ]]; then
  acceptance_redis_host="${ACCEPTANCE_REDIS_HOST:-127.0.0.1}"
  acceptance_redis_port="${ACCEPTANCE_REDIS_PORT:-6380}"
  "$acceptance_redis_cli" -h "$acceptance_redis_host" -p "$acceptance_redis_port" DEL \
    "chat:mem:guest:acceptance_guest_a_${ACCEPTANCE_RUN_ID}" \
    "chat:mem:guest:acceptance_guest_b_${ACCEPTANCE_RUN_ID}" >/dev/null
  for acceptance_user_id in ${=acceptance_user_ids}; do
    "$acceptance_redis_cli" -h "$acceptance_redis_host" -p "$acceptance_redis_port" \
      DEL "chat:mem:user:${acceptance_user_id}" >/dev/null
  done
else
  echo "Redis cleanup skipped: set ACCEPTANCE_REDIS_CLI to the local redis-cli binary" >&2
fi

echo "Cleaned acceptance run ${ACCEPTANCE_RUN_ID} from ${acceptance_db_name}"
