import Layout from "@/components/Layout";
import { APP_INFO } from "@/data/app.constants";
import "./About.css";

const About = () => {
  return (
    <Layout>
      <section className="about-page">
        <div className="layout-container">
          <div className="about-page-card">
            <h1>About Me</h1>
            <p>
              Hi, I&apos;m Rushmanth Nalluri, a Computer Science and Engineering
              (CSE) student at KL University.
            </p>
            <p>
              I enjoy learning about technology and understanding how it can be
              applied to solve real world problems. I am also interested in
              collaborating with others and sharing ideas.
            </p>
            <p>
              I am eager to grow in the field of Computer Science and contribute
              to meaningful and impactful solutions. Let&apos;s connect and talk
              about technology!
            </p>
            <a
              className="about-page-link"
              href={APP_INFO.linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Let&apos;s Connect
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
