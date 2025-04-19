import React, { useState, useEffect } from "react";

const Analytics = () => {
  const [navHeight, setNavHeight] = useState(0);

  useEffect(() => {
    const updateNavHeight = () => {
      const header = document.querySelector("header");
      if (header) {
        setNavHeight(header.offsetHeight);
      }
    };

    updateNavHeight();
    window.addEventListener("resize", updateNavHeight);
    return () => {
      window.removeEventListener("resize", updateNavHeight);
    };
  }, []);

  return (
    <section
      className="bg-background text-text min-h-screen w-full overflow-x-hidden"
      style={{ marginTop: `${navHeight}px` }}
    >
      Analytics
    </section>
  );
};

export default Analytics;
