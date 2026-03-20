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
              Hi, I am Rushmanth Nalluri, a Computer Science and Engineering
              (CSE) student at KL University.
            </p>
            <p>
              I enjoy learning about technology and understanding how it can be
              applied to solve real world problems. I am also interested in
              collaborating with others and sharing ideas.
            </p>
            <p>
              I am eager to grow in the field of Computer Science and contribute
              to meaningful and impactful solutions. Lets conntect and talk
              about technology, projects, or anything else you find interesting!
            </p>
            <a
              className="about-page-link"
              href={APP_INFO.linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Let us Connect..!!
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
