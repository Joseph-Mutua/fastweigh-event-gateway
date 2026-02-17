variable "aws_region" {
  type        = string
  description = "AWS region for deployment."
}

variable "name_prefix" {
  type        = string
  description = "Resource name prefix."
  default     = "fastweigh-gateway"
}

variable "vpc_id" {
  type        = string
  description = "Existing VPC ID."
}

variable "public_subnet_ids" {
  type        = list(string)
  description = "Public subnet IDs for ALB."
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs for ECS service."
}

variable "container_image" {
  type        = string
  description = "Container image URI."
}

variable "container_port" {
  type        = number
  description = "Application container port."
  default     = 3000
}

variable "desired_count" {
  type        = number
  description = "Desired ECS task count."
  default     = 2
}

variable "task_cpu" {
  type        = number
  description = "Fargate task CPU units."
  default     = 512
}

variable "task_memory" {
  type        = number
  description = "Fargate task memory (MiB)."
  default     = 1024
}

variable "certificate_arn" {
  type        = string
  description = "Optional ACM certificate ARN for HTTPS listener."
  default     = ""
}

variable "environment" {
  type        = map(string)
  description = "Plain environment variables for container."
  default     = {}
}

variable "secrets" {
  type        = map(string)
  description = "Map of environment variable name => AWS Secrets Manager ARN."
  default     = {}
}
