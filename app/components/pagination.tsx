import React from "react";
import { Link } from "react-router";

const PaginationButton = ({
  children,
  isActive = false,
}: {
  children: React.ReactNode;
  isActive?: boolean;
}) => {
  const className = "px-2 py-1" + (isActive ? " bg-pink-400" : "");
  return <li className={className}>{children}</li>;
};

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export const Pagination = ({ currentPage, totalPages }: PaginationProps) => {
  const numberPadding = 2;
  const pageNumbersNav = [
    <PaginationButton key={1} isActive={currentPage === 1}>
      <Link to="?page=1">1</Link>
    </PaginationButton>,
  ];

  const lowerPage = currentPage - numberPadding;
  const upperPage = currentPage + numberPadding;

  if (lowerPage > 2)
    pageNumbersNav.push(<PaginationButton key="before">…</PaginationButton>);
  for (let i = lowerPage; i < upperPage + 1; ++i) {
    if (i <= 1 || i >= totalPages) continue;
    pageNumbersNav.push(
      <PaginationButton key={i} isActive={currentPage === i}>
        <Link to={`?page=${i}`}>{i}</Link>
      </PaginationButton>,
    );
  }
  if (upperPage < totalPages - 1)
    pageNumbersNav.push(<PaginationButton key="after">…</PaginationButton>);
  if (totalPages > 1)
    pageNumbersNav.push(
      <PaginationButton key={totalPages} isActive={currentPage === totalPages}>
        <Link to={`?page=${totalPages}`}>{totalPages}</Link>
      </PaginationButton>,
    );

  return (
    <div>
      <ol className="flex justify-center">{pageNumbersNav}</ol>
    </div>
  );
};
