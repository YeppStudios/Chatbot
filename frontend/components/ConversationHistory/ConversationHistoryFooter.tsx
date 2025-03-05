import React from "react";

const Pagination: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);
const PaginationContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="flex justify-center space-x-1">{children}</div>;
const PaginationItem: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div>{children}</div>;
const PaginationLink: React.FC<{
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ children, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base ${
      isActive ? "bg-blue-500 text-white" : "bg-white text-black"
    }`}
  >
    {children}
  </button>
);

const PaginationPrevious = ({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-2 py-1 sm:px-4 sm:py-2 border rounded text-sm sm:text-base ${
      disabled
        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
        : "bg-white text-black"
    }`}
  >
    Previous
  </button>
);

const PaginationNext = ({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-2 py-1 sm:px-4 sm:py-2 border rounded text-sm sm:text-base ${
      disabled
        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
        : "bg-white text-black"
    }`}
  >
    Next
  </button>
);

const PaginationEllipsis = () => (
  <span className="px-2 py-1 sm:px-4 sm:py-2 ">...</span>
);

interface ConversationHistoryFooterProps {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  itemCount?: number;
  itemsPerPage?: number;
}

const ConversationHistoryFooter: React.FC<ConversationHistoryFooterProps> = ({
  currentPage,
  setCurrentPage,
  totalPages: passedTotalPages,
}) => {
  const totalPages = passedTotalPages - 1;
  const shouldShowFirst = currentPage > 2;
  const shouldShowLast = currentPage < totalPages - 1;

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 py-6 px-8 bg-white w-full shadow-lg">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={handlePrevious}
              disabled={currentPage <= 1}
            />
          </PaginationItem>

          {shouldShowFirst && (
            <PaginationItem>
              <PaginationLink
                isActive={false}
                onClick={() => setCurrentPage(1)}
              >
                1
              </PaginationLink>
            </PaginationItem>
          )}

          {shouldShowFirst && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {currentPage > 1 && (
            <PaginationItem>
              <PaginationLink
                isActive={false}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                {currentPage - 1}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationLink
              onClick={() => setCurrentPage(currentPage)}
              isActive
            >
              {currentPage}
            </PaginationLink>
          </PaginationItem>

          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationLink
                isActive={false}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                {currentPage + 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {shouldShowLast && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {shouldShowLast && (
            <PaginationItem>
              <PaginationLink
                isActive={false}
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={handleNext}
              disabled={currentPage >= totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default ConversationHistoryFooter;
