export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 px-8 py-4 flex items-center justify-center">
      <p className="text-sm text-gray-500">
        © {new Date().getFullYear()} Diverse Diaries. All rights reserved.
      </p>
    </footer>
  );
}
