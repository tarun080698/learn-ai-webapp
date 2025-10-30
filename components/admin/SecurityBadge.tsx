"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShield } from "@fortawesome/free-solid-svg-icons";

export function SecurityBadge() {
  return (
    <div className="flex items-center justify-center mb-8">
      <div
        className="security-badge px-4 py-2 rounded-full  font-medium flex items-center space-x-2"
        style={{ color: "white" }}
      >
        <FontAwesomeIcon
          icon={faShield}
          className="text-xs"
          style={{ color: "white" }}
        />
        <span>Secure Admin Access</span>
      </div>
    </div>
  );
}
