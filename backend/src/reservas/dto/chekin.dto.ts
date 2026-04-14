export class CheckinDto {
  checkInTime: string;
  qrCode?: string | null;
  manual?: boolean;
  motivo_manual?: string;
}
