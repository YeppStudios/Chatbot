import Chat from "@/components/Chat";

export default function Home() {
  return (
    <div className="fixed inset-0 bg-transparent pointer-events-none flex items-end justify-end">
      <Chat />
    </div>
  );
}