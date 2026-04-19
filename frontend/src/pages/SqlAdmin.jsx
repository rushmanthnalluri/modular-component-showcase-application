import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { getSqlCategories, getSqlComponents, getSqlUsers } from "@/services/sqlAdminService";
import { useToast } from "@/use-toast";
import "./SqlAdmin.css";

const SqlAdmin = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [components, setComponents] = useState([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const [nextUsers, nextCategories, nextComponents] = await Promise.all([
          getSqlUsers(),
          getSqlCategories(),
          getSqlComponents(),
        ]);

        if (!active) {
          return;
        }

        setUsers(nextUsers);
        setCategories(nextCategories);
        setComponents(nextComponents);
      } catch {
        if (active) {
          toast({
            title: "SQL admin unavailable",
            description: "Check PostgreSQL configuration and try again.",
          });
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [toast]);

  return (
    <Layout>
      <div className="layout-container sql-admin-page">
        <h1>SQL Admin</h1>
        <p>Read-only snapshot of PostgreSQL mirror data.</p>

        {isLoading ? <div className="sql-admin-state">Loading SQL data...</div> : null}

        {!isLoading ? (
          <div className="sql-admin-grid">
            <section className="sql-card">
              <h2>Users ({users.length})</h2>
              <pre>{JSON.stringify(users.slice(0, 10), null, 2)}</pre>
            </section>
            <section className="sql-card">
              <h2>Categories ({categories.length})</h2>
              <pre>{JSON.stringify(categories.slice(0, 10), null, 2)}</pre>
            </section>
            <section className="sql-card">
              <h2>Components ({components.length})</h2>
              <pre>{JSON.stringify(components.slice(0, 10), null, 2)}</pre>
            </section>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default SqlAdmin;
