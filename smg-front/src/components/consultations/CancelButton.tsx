import { css } from "@/styled-system/css";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useState } from "react";

interface CancelButtonProps {
  isCancelling: boolean;
  onCancel: () => void;
}

export function CancelButton({ isCancelling, onCancel }: CancelButtonProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleCancelClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmCancel = () => {
    setShowConfirmModal(false);
    onCancel();
  };

  const buttonStyles = css({
    display: "block",
    width: "100%",
    py: "3",
    px: "4",
    bg: "red.600",
    color: "white",
    fontWeight: "semibold",
    borderRadius: "md",
    _hover: {
      bg: "red.700",
    },
    _disabled: {
      bg: "gray.400",
      cursor: "not-allowed",
    },
  });

  return (
    <>
      <button 
        type="button" 
        className={buttonStyles} 
        disabled={isCancelling}
        onClick={handleCancelClick}
      >
        {isCancelling ? "キャンセル中..." : "申込をキャンセルする"}
      </button>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmCancel}
        title="キャンセルの確認"
        message="この申込をキャンセルしてもよろしいですか？この操作は取り消すことができません。"
      />
    </>
  );
} 