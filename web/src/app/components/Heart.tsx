import React from "react";

interface HeartProps {
        path: string;
    }

export default function Heart({path}: HeartProps) {
    return (
      <div>
        <iframe
          src={path}
          width="600px"
          height="600px"
          style={{ border: "none" }}
        ></iframe>
      </div>
    );
  }
  