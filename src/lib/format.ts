export function formatPrice(price: number) {
  if (price === 0) return "나눔";
  return new Intl.NumberFormat("ko-KR").format(price) + "원";
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function postTypeLabel(type: string) {
  const labels: Record<string, string> = {
    general: "일반",
    question: "질문",
    review: "후기",
    purchase_help: "구매고민",
    info: "정보",
    trade: "교환",
    transfer: "양도",
    giveaway: "나눔",
    notice: "공지"
  };
  return labels[type] ?? type;
}

export function tradeTypeLabel(type: string) {
  const labels: Record<string, string> = {
    sell: "판매",
    exchange: "교환",
    giveaway: "나눔"
  };
  return labels[type] ?? type;
}

export function tradeStatusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "거래 가능",
    reserved: "예약중",
    completed: "거래완료",
    hidden: "숨김",
    reported: "신고됨"
  };
  return labels[status] ?? status;
}

export function sourceLabel(source: string) {
  const labels: Record<string, string> = {
    official_shop: "공식몰",
    naver_shopping: "네이버",
    coupang: "쿠팡",
    user_submission: "유저 제보",
    internal_market: "세모덕 마켓",
    external_search: "외부 검색"
  };
  return labels[source] ?? source;
}
