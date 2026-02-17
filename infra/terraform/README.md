# Terraform Deployment Template (AWS ECS Fargate)

This template deploys the Fast-Weigh Event Gateway to AWS ECS Fargate behind an Application Load Balancer.

## What It Creates

- ECS cluster, task definition, and service
- ALB + target group + listener
- Security groups
- CloudWatch log group
- IAM roles for task execution and task runtime

## Prerequisites

- Existing VPC and subnets
- Container image in ECR (or other registry reachable by ECS)
- Redis endpoint for BullMQ/idempotency
- Secrets in AWS Secrets Manager

## Deploy

1. Copy `terraform.tfvars.example` to `terraform.tfvars` and edit values.
2. Initialize Terraform:

```bash
terraform init
```

3. Review the plan:

```bash
terraform plan
```

4. Apply:

```bash
terraform apply
```

## Production Notes

- Use HTTPS by setting `certificate_arn`.
- Restrict ingress CIDRs with WAF/ALB SG rules as needed.
- Keep all Fast-Weigh secrets in Secrets Manager.
