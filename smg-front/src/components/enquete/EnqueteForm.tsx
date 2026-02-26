import { useState } from "react";
import { css } from "../../../styled-system/css";
import { TextInput } from "./TextInput";
import { TextArea } from "./TextArea";
import { RadioGroup } from "./RadioGroup";
import { Checkbox } from "./Checkbox";
import { SubmitButton } from "./SubmitButton";
import { Header } from "./Header";
import { Footer } from "./Footer";

type EnqueteFormProps = {
  enqueteId: string;
};

export const EnqueteForm = ({ enqueteId }: EnqueteFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    q3Rating: "",
    q3Reason: "",
    q5Rating: "",
    q5Reason: "",
    q7: "",
    q8: "",
    q9Rating: "",
    q9Reason: "",
    q11Rating: "",
    q11Reason: "",
    q13: "",
    q14: "",
    q15: "",
    q16: "",
    q17: "",
    isAnonymous: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("送信されたデータ:", formData);
    // ここでAPIにデータを送信する処理を追加
    alert("アンケートを送信しました。ありがとうございます。");
  };

  const ratingOptions = [
    { value: "非常に満足", label: "非常に満足" },
    { value: "やや満足", label: "やや満足" },
    { value: "どちらともいえない", label: "どちらともいえない" },
    { value: "やや不満", label: "やや不満" },
  ];

  const understandingOptions = [
    { value: "十分に理解できた", label: "★★★★★　十分に理解できた" },
    { value: "概ね理解できた", label: "★★★★　概ね理解できた" },
    { value: "一部理解できた", label: "★★★　一部理解できた" },
    { value: "ほとんど理解できなかった", label: "★★　ほとんど理解できなかった" },
    { value: "全く理解できなかった", label: "★　全く理解できなかった" },
  ];

  const getFormTitle = () => {
    return enqueteId === "osaka-meeting" ? "3/14 大阪定例会アンケート" : "アンケート";
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      isAnonymous: e.target.checked
    });
  };

  return (
    <div >
      <div className={css({
      maxW: "650px",
      mx: { base: "3", md: "auto" },
      my: "4",
      bg: "white",
      rounded: "md",
      shadow: "md",
    })}>
      <Header title={getFormTitle()} />
      <div className={css({
        p: "6",
      })}>
      <div className={css({ mb: "6", px: "2" })}>
        <p>本日はご参加いただきありがとうございました。</p>
        <p>お手数ですが、今後の参考のためにアンケートへのご協力をお願いいたします。</p>
      </div>

      <form onSubmit={handleSubmit}>
        <TextInput
          label="Q1.お名前（任意）"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="※個別対応のある場合はご記入ください"
        />

        <TextInput
          label="Q2.会社名（任意）"
          name="company"
          value={formData.company}
          onChange={handleChange}
        />

        <RadioGroup
          label="Q3.【知の探求】講義内容の満足度"
          name="q3Rating"
          options={ratingOptions}
          selectedValue={formData.q3Rating}
          onChange={handleRadioChange}
          required
        />

        <TextArea
          label="Q4. Q3の回答理由をお聞かせください"
          name="q3Reason"
          value={formData.q3Reason}
          onChange={handleChange}
          required
        />

        <RadioGroup
          label="Q5.【智慧先生】講義内容の満足度"
          name="q5Rating"
          options={ratingOptions}
          selectedValue={formData.q5Rating}
          onChange={handleRadioChange}
          required
        />

        <TextArea
          label="Q6. Q5の回答理由をお聞かせください"
          name="q5Reason"
          value={formData.q5Reason}
          onChange={handleChange}
          required
        />

        <TextArea
          label="Q7. 受講いただいたうえで、どのようなことを実践しようと思いましたか？"
          name="q7"
          value={formData.q7}
          onChange={handleChange}
        />

        <TextArea
          label="Q8. 次回定例会までの目標はどのようなものですか？"
          name="q8"
          value={formData.q8}
          onChange={handleChange}
        />

        <RadioGroup
          label="Q9.【知の探求】講義内容について、ご自身の理解度を5段階で評価してください。"
          name="q9Rating"
          options={understandingOptions}
          selectedValue={formData.q9Rating}
          onChange={handleRadioChange}
          required
        />

        <TextArea
          label="Q10. Q9の回答理由をお聞かせください。"
          name="q9Reason"
          value={formData.q9Reason}
          onChange={handleChange}
          required
        />

        <RadioGroup
          label="Q11.【智慧先生】講義内容について、ご自身の理解度を5段階で評価してください。"
          name="q11Rating"
          options={understandingOptions}
          selectedValue={formData.q11Rating}
          onChange={handleRadioChange}
          required
        />

        <TextArea
          label="Q12. Q11の回答理由をお聞かせください。"
          name="q11Reason"
          value={formData.q11Reason}
          onChange={handleChange}
          required
        />

        <TextArea
          label="Q13. 講義内容についてのご意見があればお聞かせください。"
          name="q13"
          value={formData.q13}
          onChange={handleChange}
        />

        <TextArea
          label="Q14. 今後受けて欲しいゲスト講師"
          name="q14"
          value={formData.q14}
          onChange={handleChange}
        />

        <TextArea
          label="Q15. 今後取り上げて欲しい内容"
          name="q15"
          value={formData.q15}
          onChange={handleChange}
        />

        <TextArea
          label="Q16. 講座運営に関するご意見をご自由にお書きください。"
          name="q16"
          value={formData.q16}
          onChange={handleChange}
        />

        <TextArea
          label="Q17. 備考"
          name="q17"
          value={formData.q17}
          onChange={handleChange}
        />

        <div className={css({ mb: "6" })}>
          <label className={css({
            display: "flex",
            alignItems: "center",
            gap: "2",
            cursor: "pointer"
          })}>
            <input
              type="checkbox"
              name="isAnonymous"
              checked={formData.isAnonymous}
              onChange={handleCheckboxChange}
              className={css({
                w: "4",
                h: "4",
                borderColor: "gray.300",
                rounded: "sm"
              })}
            />
            <span className={css({ fontWeight: "medium" })}>匿名希望</span>
          </label>
        </div>

        <SubmitButton label="アンケートを送信する" />
      </form>

      <Footer />
      </div>
      </div>
    </div>
  );
}; 