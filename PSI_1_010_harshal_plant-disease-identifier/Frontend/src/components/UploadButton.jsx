export default function UploadButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="btn-primary flex items-center gap-2 group"
    >
      <span className="text-xl transition-transform duration-300">📸</span>
      <span>Upload Photo</span>
    </button>
  );
}
