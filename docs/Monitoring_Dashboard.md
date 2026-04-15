# Monitoring and Observability (Review III)

## Metrics Tracked
1. API request count and response latency
- Source: Application Insights requests telemetry
- Goal: Keep API p95 latency under 500 ms

2. Error rate
- Source: Application Insights failed requests / exceptions
- Goal: Keep 5xx rate below 1%

3. Compute utilization
- Source: App Service CPU and memory metrics
- Goal: Trigger scale-out when CPU remains above 70%

## Alert Rules
1. High error-rate alert
- Condition: 5xx > 1% over 5 minutes
- Action: Email/Teams notification to engineering channel

2. High CPU alert
- Condition: CPU > 70% for 10 minutes
- Action: Trigger autoscale policy and notify platform owner

3. Backend Metrics Alert (sim via middleware logs)
- Condition: Error rate >1% or p95 latency >500ms (logged to console/App Insights)


## Dashboard Panels (Recommended)
1. Throughput over time
2. Failure trend by endpoint
3. Top slow endpoints
4. Instance count and CPU trend
