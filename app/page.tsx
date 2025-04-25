import ReadingPractice from "./ReadingPractice";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7fa]" style={{ fontFamily: 'OpenDyslexic, Arial, sans-serif' }}>
      <ReadingPractice />
    </div>
  );
}
