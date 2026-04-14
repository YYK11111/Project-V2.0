#!/bin/bash

# ========================================
# 工作流引擎功能测试脚本
# 执行时间: 2026-04-09
# 说明: 测试工作流引擎的完整流程
# ========================================

BASE_URL="http://localhost:3000/api"
echo "=========================================="
echo "工作流引擎功能测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果统计
TOTAL=0
PASSED=0
FAILED=0

# 测试函数
test_api() {
    local test_name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    
    TOTAL=$((TOTAL + 1))
    echo -e "${YELLOW}测试 $TOTAL: $test_name${NC}"
    echo "请求: $method $url"
    
    if [ -n "$data" ]; then
        response=$(curl -s -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -X "$method" "$url")
    fi
    
    # 检查响应是否包含错误
    if echo "$response" | grep -q '"statusCode":4'; then
        echo -e "${RED}❌ 失败${NC}"
        echo "响应: $response"
        FAILED=$((FAILED + 1))
    else
        echo -e "${GREEN}✅ 通过${NC}"
        PASSED=$((PASSED + 1))
    fi
    echo ""
}

echo "=========================================="
echo "步骤1: 创建工作流定义"
echo "=========================================="
echo ""

# 创建请假审批流程定义
test_api "创建请假审批流程定义" "POST" "$BASE_URL/workflow/definitions" '{
  "name": "请假审批流程",
  "code": "leave_approval",
  "description": "员工请假审批流程",
  "category": "HR",
  "nodes": [
    {
      "id": "start",
      "name": "开始",
      "type": "start",
      "properties": {}
    },
    {
      "id": "approval_1",
      "name": "部门经理审批",
      "type": "approval",
      "properties": {
        "assigneeType": "role",
        "roleId": "2",
        "multiInstanceType": "parallel"
      }
    },
    {
      "id": "approval_2",
      "name": "人事审批",
      "type": "approval",
      "properties": {
        "assigneeType": "role",
        "roleId": "3",
        "multiInstanceType": "parallel"
      }
    },
    {
      "id": "notification",
      "name": "发送通知",
      "type": "notification",
      "properties": {
        "notificationTemplate": "请假申请已通过",
        "notificationContent": "您的请假申请已经通过审批",
        "notificationReceiverExpr": "${starterId}"
      }
    },
    {
      "id": "end",
      "name": "结束",
      "type": "end",
      "properties": {}
    }
  ],
  "flows": [
    {
      "id": "flow_1",
      "sourceNodeId": "start",
      "targetNodeId": "approval_1"
    },
    {
      "id": "flow_2",
      "sourceNodeId": "approval_1",
      "targetNodeId": "approval_2"
    },
    {
      "id": "flow_3",
      "sourceNodeId": "approval_2",
      "targetNodeId": "notification"
    },
    {
      "id": "flow_4",
      "sourceNodeId": "notification",
      "targetNodeId": "end"
    }
  ]
}'

echo "=========================================="
echo "步骤2: 查询流程定义列表"
echo "=========================================="
echo ""

test_api "获取流程定义列表" "GET" "$BASE_URL/workflow/definitions" ""

echo "=========================================="
echo "步骤3: 发布流程定义"
echo "=========================================="
echo ""

# 先获取刚创建的流程定义ID
DEFINITION_ID=$(curl -s "$BASE_URL/workflow/definitions" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ -n "$DEFINITION_ID" ]; then
    test_api "发布流程定义 (ID: $DEFINITION_ID)" "POST" "$BASE_URL/workflow/definitions/$DEFINITION_ID/publish" ""
else
    echo -e "${RED}⚠️  未找到流程定义ID，跳过发布测试${NC}"
    echo ""
fi

echo "=========================================="
echo "步骤4: 启动流程实例"
echo "=========================================="
echo ""

test_api "启动请假流程实例" "POST" "$BASE_URL/workflow/instances/start?userId=user001" '{
  "code": "leave_approval",
  "businessKey": "LEAVE_20260409_001",
  "variables": {
    "days": 3,
    "reason": "个人事务",
    "startDate": "2026-04-10",
    "endDate": "2026-04-12"
  }
}'

echo "=========================================="
echo "步骤5: 查询我的待办任务"
echo "=========================================="
echo ""

test_api "查询用户 user001 的待办任务" "GET" "$BASE_URL/workflow/tasks/my?userId=user001" ""

echo "=========================================="
echo "测试完成"
echo "=========================================="
echo ""
echo -e "总计: $TOTAL 个测试"
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
else
    echo -e "${YELLOW}⚠️  部分测试失败，请检查日志${NC}"
fi

echo ""
echo "提示: 可以使用以下命令查看详细日志:"
echo "  tail -f nest-admin/log/*.log"
