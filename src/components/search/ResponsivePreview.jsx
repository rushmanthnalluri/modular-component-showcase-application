import "./responsive-preview.css";

export default function ResponsivePreview({ children }) {
  return (
    <section className="responsive-preview">
      {children}
    </section>
  );
}
