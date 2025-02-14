import styled, { keyframes } from "styled-components";
import React from "react";

interface colorProp {
  color: string;
}

const spinAnimation = keyframes`
100% {
    transform: rotate(1turn);
 }
`;

export const Loader = styled.div<colorProp>`
  width: 1.3rem;
  height: 1.3rem;
  border-radius: 50%;
  background: ${(
    props
  ) => `radial-gradient(farthest-side, ${props.color} 94%,#0000) top/0.1rem 0.1rem no-repeat,
        conic-gradient(#0000 30%, ${props.color})`};
  -webkit-mask: radial-gradient(
    farthest-side,
    #0000 calc(100% - 0.2rem),
    #000 0
  );
  animation: ${spinAnimation} 1s infinite linear;
`;

const pulse = keyframes`
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

export const SkeletonLoader = styled.div`
  width: 100%;
  height: 20px;
  background: linear-gradient(90deg, #ececec 25%, #f1f1f1 50%, #ececec 75%);
  background-size: 200% 100%;
  animation: ${pulse} 1.5s ease-in-out infinite;
  border-radius: 4px;
`;

type LineProps = {
  isLast: boolean;
};

const Line = styled.div<LineProps>`
  width: ${({ isLast }) => (isLast ? "50%" : "100%")};
  height: 1.2rem;
  background: linear-gradient(90deg, #f6f6fb, white, #f6f6fb);
  background-size: 200% 100%;
  animation: ${pulse} 2s linear infinite;
  border-radius: 7px;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const MultiLineSkeletonLoader = (props: {
  lines: number;
  justifyContent: string;
}) => {
  const { lines } = props;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: `${props.justifyContent}`,
        flexWrap: "wrap",
        marginTop: "0.5rem",
      }}
    >
      {Array.from({ length: lines }).map((_, index) => (
        <Line key={index} isLast={index === lines - 1} />
      ))}
    </div>
  );
};
