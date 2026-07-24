/** 한국 휴대폰 번호(예: 010-1234-5678, 01012345678)를 Firebase Phone Auth가 요구하는 E.164(+82...) 형식으로 변환한다. */
export function toE164Korea(input: string): string | null {
  const digits = input.replace(/[^0-9]/g, '');
  if (!/^01[0-9]{8,9}$/.test(digits)) return null;
  return `+82${digits.slice(1)}`;
}

/** 입력창에 보여줄 때 010-1234-5678 형태로 자동 하이픈을 넣어준다. */
export function formatPhoneInput(input: string): string {
  const digits = input.replace(/[^0-9]/g, '').slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
