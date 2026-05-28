import { BadRequestException } from '@nestjs/common';
import { RefundStatus } from '@prisma/client';

const allowedTransitions: Record<RefundStatus, RefundStatus[]> = {
  [RefundStatus.REQUESTED]: [RefundStatus.APPROVED, RefundStatus.REJECTED],
  [RefundStatus.APPROVED]: [RefundStatus.COMPLETED, RefundStatus.REJECTED],
  [RefundStatus.REJECTED]: [],
  [RefundStatus.COMPLETED]: [],
};

export function assertRefundTransition(
  currentStatus: RefundStatus | string,
  nextStatus: RefundStatus | string,
): asserts nextStatus is RefundStatus {
  const allowed = allowedTransitions[currentStatus as RefundStatus] ?? [];

  if (!allowed.includes(nextStatus as RefundStatus)) {
    throw new BadRequestException(
      `Invalid refund transition: ${currentStatus} -> ${nextStatus}`,
    );
  }
}

export function normalizeRefundStatus(value: string): RefundStatus {
  if (
    value === RefundStatus.REQUESTED ||
    value === RefundStatus.APPROVED ||
    value === RefundStatus.REJECTED ||
    value === RefundStatus.COMPLETED
  ) {
    return value;
  }

  throw new BadRequestException(`Unsupported refund status: ${value}`);
}
