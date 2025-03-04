import ConversationHistory from "@/components/ConversationHistory";
import AuthWrapper from "./AuthWrapper";

const page = () => {
  return (
    <AuthWrapper>
      <ConversationHistory />
    </AuthWrapper>
  );
};
export default page;
