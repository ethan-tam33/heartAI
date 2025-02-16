import React from "react";

interface HeartProps {
        path: string;
    }

export default function Heart({path}: HeartProps) {
    return (
      <div>
        <iframe
          src={path}
          width="700px"
          height="700px"
          style={{ border: "none" }}
        ></iframe>
      </div>
    );
  }
  