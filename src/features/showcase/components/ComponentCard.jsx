import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
const ComponentCard = ({
  id,
  name,
  description,
  category,
  index,
  thumbnail,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative rounded-2xl border border-border/80 bg-card/95 overflow-hidden hover:border-primary/40 transition-all duration-300 hover-lift shadow-sm"
    >
      <div className="h-40 bg-bg-main/80 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light/30 via-accent/5 to-transparent z-10" />
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={`${name} preview`}
            className="h-full w-full object-cover object-center"
            loading="lazy"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/25">
              <span className="text-primary text-xl font-bold">
                {name.charAt(0)}
              </span>
            </div>
          </div>
        )}

        <div className="absolute inset-0 z-20 bg-card/85 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
          <Link to={`/component/${id}`}>
            <Button variant="accent" size="sm" className="gap-2">
              View <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
            {name}
          </h3>
          <Badge variant="secondary" className="text-xs capitalize">
            {category}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export default ComponentCard;
