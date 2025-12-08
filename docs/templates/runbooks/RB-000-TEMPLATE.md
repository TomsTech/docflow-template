# RB-{{NUMBER}}: {{TITLE}}

> Operational runbook for handling {{INCIDENT_TYPE}}.

---

## Metadata

| Field | Value |
|-------|-------|
| **Severity** | Critical / High / Medium / Low |
| **Expected Resolution** | < X minutes |
| **Last Updated** | {{DATE}} |
| **Owner** | {{TEAM/PERSON}} |
| **Requires Escalation** | Yes / No |

---

## Overview

### Description

Brief description of the incident type this runbook addresses.

### When to Use

Use this runbook when:
- Symptom 1 is observed
- Symptom 2 is observed
- Alert X is triggered

### Prerequisites

- [ ] Access to {{SYSTEM}}
- [ ] Credentials for {{SERVICE}}
- [ ] Required tools installed

---

## Symptoms

### Primary Indicators

| Symptom | How to Identify | Severity |
|---------|-----------------|----------|
| Symptom 1 | Log message / metric | High |
| Symptom 2 | User report / alert | Medium |

### Alert Triggers

```
Alert Name: {{ALERT_NAME}}
Condition: {{CONDITION}}
Threshold: {{THRESHOLD}}
```

---

## Diagnostic Steps

### Step 1: Initial Assessment

```bash
# Check service status
systemctl status {{SERVICE}}

# Expected output:
# Active: active (running)
```

### Step 2: Check Logs

```bash
# View recent logs
journalctl -u {{SERVICE}} --since "10 minutes ago"

# Look for:
# - Error messages
# - Connection failures
# - Resource exhaustion
```

### Step 3: Verify Dependencies

```bash
# Check database connectivity
psql -h {{HOST}} -U {{USER}} -c "SELECT 1"

# Check external API
curl -s -o /dev/null -w "%{http_code}" https://api.example.com/health
```

### Decision Tree

```
Is the service running?
├── No → Go to Resolution Step 1
└── Yes
    └── Are logs showing errors?
        ├── Yes → Identify error type
        │   ├── Database error → Go to Resolution Step 2
        │   ├── Memory error → Go to Resolution Step 3
        │   └── Unknown → Escalate
        └── No → Check external dependencies
```

---

## Resolution Steps

### Step 1: Service Restart (Basic)

**When**: Service is not running or unresponsive

```bash
# Stop the service
sudo systemctl stop {{SERVICE}}

# Wait for graceful shutdown
sleep 10

# Start the service
sudo systemctl start {{SERVICE}}

# Verify status
systemctl status {{SERVICE}}
```

**Expected Outcome**: Service returns to active (running) state

---

### Step 2: Database Connection Issues

**When**: Logs show database connection errors

```bash
# Check database is reachable
pg_isready -h {{DB_HOST}} -p 5432

# Check connection count
psql -c "SELECT count(*) FROM pg_stat_activity"

# If connections exhausted, terminate idle connections
psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '10 minutes'"
```

**Expected Outcome**: Database accepts new connections

---

### Step 3: Memory Issues

**When**: Out of memory errors in logs

```bash
# Check current memory usage
free -h

# Find memory-heavy processes
ps aux --sort=-%mem | head -10

# Clear system cache (if safe)
sync && echo 3 > /proc/sys/vm/drop_caches
```

**Expected Outcome**: Memory usage returns to normal

---

## Rollback Procedure

If resolution steps fail or cause additional issues:

```bash
# Restore from last known good state
# Step 1: Stop current service
sudo systemctl stop {{SERVICE}}

# Step 2: Restore previous version
sudo apt install {{PACKAGE}}={{PREVIOUS_VERSION}}

# Step 3: Restore configuration
sudo cp /etc/{{SERVICE}}/config.backup /etc/{{SERVICE}}/config

# Step 4: Restart
sudo systemctl start {{SERVICE}}
```

---

## Verification

### Checklist

- [ ] Service is running (`systemctl status {{SERVICE}}`)
- [ ] Health endpoint returns 200 (`curl -s http://localhost:{{PORT}}/health`)
- [ ] No errors in recent logs (`journalctl -u {{SERVICE}} --since "5 minutes ago" | grep -i error`)
- [ ] Metrics are being collected (check Grafana dashboard)
- [ ] Dependent services are functional

### Smoke Test

```bash
# Run basic functionality test
curl -X POST http://localhost:{{PORT}}/api/test \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Expected response:
# {"success": true}
```

---

## Post-Incident Actions

### Immediate

- [ ] Update status page (if customer-facing)
- [ ] Notify stakeholders via {{CHANNEL}}
- [ ] Document timeline in incident log

### Follow-Up

- [ ] Create post-mortem document within 48 hours
- [ ] Identify root cause
- [ ] Create tickets for preventive measures
- [ ] Update this runbook if procedures changed

### Communication Template

```
Subject: [RESOLVED] {{INCIDENT_TITLE}}

Status: Resolved
Duration: HH:MM
Impact: {{IMPACT_DESCRIPTION}}

Timeline:
- HH:MM - Incident detected
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Resolution applied
- HH:MM - Service restored

Root Cause: {{ROOT_CAUSE}}

Next Steps: {{FOLLOW_UP_ACTIONS}}
```

---

## Escalation Path

| Level | Contact | When to Escalate |
|-------|---------|------------------|
| L1 | On-call engineer | First response |
| L2 | Team lead | > 30 mins unresolved |
| L3 | Engineering manager | > 1 hour / customer impact |
| L4 | CTO | > 2 hours / major outage |

### Escalation Contacts

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| On-call | Rotation | PagerDuty | #oncall |
| Team Lead | {{NAME}} | {{PHONE}} | @{{HANDLE}} |

---

## Related Documents

- [Service Architecture](../architecture/README.md)
- [Deployment Guide](../deployment/README.md)
- [Related Runbook](./RB-XXX.md)

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| {{DATE}} | {{AUTHOR}} | Initial creation |
