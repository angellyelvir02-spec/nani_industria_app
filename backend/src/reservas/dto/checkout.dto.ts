export class CheckoutDto {
  checkOutTime: string; // timestamp en ms como string
  totalHours: string; // horas calculadas por el frontend (se recalculan en backend)
  manual?: boolean; // NUEVO
  motivo_manual?: string; // NUEVO
}
