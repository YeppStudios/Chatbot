import PDFManagement from "@/components/PDFManagement";
import AuthWrapper from "./AuthWrapper";

const page = () => {
  return (
    <AuthWrapper>
      <PDFManagement />
    </AuthWrapper>
  );
};
export default page;