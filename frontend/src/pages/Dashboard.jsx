import { useAuth } from "../contexts/AuthContext";
import bgImage from "../assets/images/power_line.png";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-primary/30 backdrop-blur-sm"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 pt-32 px-4 max-w-7xl mx-auto">
        {/* Main Title */}
        <h1 className="font-helvetica sm:text-[8rem] text-6xl font-bold text-light tracking-wider mb-20">
          LOGLOC
        </h1>

        {/* Navigation Links */}
        <div className="space-y-4 mb-20">
          <a
            href="/dashboard"
            className="block w-40 text-xl text-light hover:text-accent-primary transition-colors"
          >
            Dashboard →
          </a>
          <a
            href="/work"
            className="block w-40 text-xl text-light hover:text-accent-primary transition-colors"
          >
            Work →
          </a>
          <a
            href="/about"
            className="block w-40 text-xl text-light hover:text-accent-primary transition-colors"
          >
            About →
          </a>
        </div>

        {/* Description */}
        <div className="max-w-2xl">
          <p className="text-light/90 text-lg leading-relaxed">
            From precision voltage monitoring to comprehensive data analysis,
            LogLoc is advancing electrical infrastructure management to ensure
            reliable power distribution across industries.
          </p>
        </div>

        {/* User Welcome */}
        {user && (
          <div className="mt-8 bg-light/10 backdrop-blur-md rounded-lg p-6 max-w-md">
            <p className="text-light text-xl">
              Welcome back,{" "}
              <span className="text-accent-primary">{user.UserName}</span>
            </p>
            <a
              href="/dashboard"
              className="mt-4 inline-block bg-accent-primary hover:bg-accent-primary/90 text-light px-6 py-2 rounded-lg transition-colors"
            >
              View Dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
