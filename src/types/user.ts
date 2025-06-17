export interface UserInfo {
  school: string;      // 학교 이름
  grade: number;       // 학년
  classNum: number;    // 반
  studentNum: number;  // 번호
  schoolLatitude: number;  // 학교 위도 (좌표)
  schoolLongitude: number; // 학교 경도 (좌표)
  homeAddress: string;    // 집 주소 (선택 사항)
}