import Header from "./Header";
import Footer from "./Footer";
import "./Layout.css";

const Layout = ({ children }) => {
  return (
    <div className="layout-page">
      <Header />
      <main className="layout-main">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
