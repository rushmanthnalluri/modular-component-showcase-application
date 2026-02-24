import Header from "./Header";
import Footer from "./Footer";
const Layout = ({ children }) => {
  return <div className="min-h-screen flex flex-col relative overflow-x-clip">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,hsl(var(--primary-light)/0.35)_0%,transparent_40%),radial-gradient(circle_at_86%_6%,hsl(var(--accent)/0.16)_0%,transparent_32%)]" />
      <Header />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </div>;
};
var stdin_default = Layout;
export {
  stdin_default as default
};
