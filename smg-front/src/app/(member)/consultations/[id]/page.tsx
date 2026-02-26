"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { css } from "@/styled-system/css";
import { ConsultationForm } from "@/components/consultations";
import { getConsultationById, type ConsultationDetail, checkUserApplications } from "@/lib/api/consultation";
// BackButtonはConsultationForm内に配置しました

export default function ConsultationDetailPage() {
  const params = useParams();
  const [consultation, setConsultation] = useState<ConsultationDetail | null>(null);
  const [isApplied, setIsApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        const data = await getConsultationById(params.id as string);
        setConsultation(data);
        
        // 申し込み状況をチェック
        const applicationStatus = await checkUserApplications([data.consultation_id]);
        setIsApplied(applicationStatus[data.consultation_id] || false);
      } catch (err) {
        setError("個別相談の情報の取得に失敗しました。");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsultation();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className={css({
        textAlign: "center",
        padding: "2rem",
      })}>
        読み込み中...
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className={css({
        textAlign: "center",
        padding: "2rem",
        color: "red.500",
      })}>
        {error || "個別相談の情報が見つかりませんでした。"}
      </div>
    );
  }

  return (
    <div className={css({
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "2rem 1rem",
    })}>
      <ConsultationForm consultation={consultation} isApplied={isApplied} />
    </div>
  );
}
