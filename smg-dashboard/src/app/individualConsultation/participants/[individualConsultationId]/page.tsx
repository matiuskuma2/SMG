import { createClient } from '@/lib/supabase/server';
import type {
  IndividualConsultationFormType,
  Participant,
} from '@/types/individualConsultation';
import { Suspense } from 'react';
import { ParticipantsClientPage } from './client';

// このコンポーネントはサーバーコンポーネントとして実行される
export default async function ParticipantsPage({
  params,
}: {
  params: { individualConsultationId: string };
}) {
  // サーバーサイドでSupabaseクライアントを作成
  const supabase = createClient();

  // データをサーバーサイドで直接取得
  async function getConsultationDetails(): Promise<IndividualConsultationFormType> {
    try {
      const { data, error } = await supabase
        .from('mst_consultation')
        .select(`
          consultation_id,
          title,
          image_url,
          description,
          application_start_datetime,
          application_end_datetime,
          publish_start_at,
          publish_end_at,
          instructor_id
        `)
        .eq('consultation_id', params.individualConsultationId)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('Error fetching consultation details:', error);
        throw new Error('個別相談会の詳細情報の取得に失敗しました');
      }

      // 講師情報の取得
      const { data: instructorData, error: instructorError } = await supabase
        .from('mst_user')
        .select(`
          user_id,
          username
        `)
        .eq('user_id', data.instructor_id)
        .single();

      if (instructorError) {
        console.error('Error fetching instructor data:', instructorError);
      }

      // スケジュール情報の取得
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('mst_consultation_schedule')
        .select(`
          schedule_id,
          schedule_datetime
        `)
        .eq('consultation_id', params.individualConsultationId)
        .is('deleted_at', null)
        .order('schedule_datetime', { ascending: true });

      if (scheduleError) {
        console.error('Error fetching consultation schedules:', scheduleError);
        throw new Error('個別相談会のスケジュール情報の取得に失敗しました');
      }

      // データを適切な形式に変換
      const consultationDetails: IndividualConsultationFormType = {
        consultation_id: data.consultation_id,
        title: data.title,
        image_url: data.image_url,
        application_start_datetime: new Date(
          data.application_start_datetime,
        ).toLocaleDateString('ja-JP'),
        application_end_datetime: new Date(
          data.application_end_datetime,
        ).toLocaleDateString('ja-JP'),
        publish_start_at: data.publish_start_at
          ? new Date(data.publish_start_at).toLocaleDateString('ja-JP')
          : undefined,
        publish_end_at: data.publish_end_at
          ? new Date(data.publish_end_at).toLocaleDateString('ja-JP')
          : undefined,
        schedule_datetime: scheduleData.map((schedule) =>
          new Date(schedule.schedule_datetime).toLocaleDateString('ja-JP'),
        ),
        description: data.description,
        instructor_id: data.instructor_id,
        instructor_name: instructorData?.username || '',
      };

      return consultationDetails;
    } catch (error) {
      console.error('Error in getConsultationDetails:', error);
      throw new Error('個別相談会の詳細情報の取得に失敗しました');
    }
  }

  async function getConsultationParticipants(): Promise<Participant[]> {
    try {
      const { data, error } = await supabase
        .from('trn_consultation_application')
        .select(`
          application_id,
          user_id,
          is_urgent,
          is_first_consultation,
          selection_status,
          selected_candidate_id,
          notes,
          created_at
        `)
        .eq('consultation_id', params.individualConsultationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching consultation participants:', error);
        throw new Error('個別相談会の参加者情報の取得に失敗しました');
      }

      // 参加者データを一つずつ処理
      const participants = await Promise.all(
        data.map(
          async (application: {
            application_id: string;
            user_id: string;
            is_urgent: boolean;
            is_first_consultation: boolean;
            selection_status: string;
            selected_candidate_id: string | null;
            notes: string | null;
            created_at: string | null;
          }) => {
            // ユーザー情報の取得
            const { data: userData, error: userError } = await supabase
              .from('mst_user')
              .select(`
            user_id,
            username,
            email,
            company_name,
            phone_number,
            user_type,
            icon,
            bio
          `)
              .eq('user_id', application.user_id)
              .single();

            if (userError) {
              console.error('Error fetching user data:', userError);
            }

            // ユーザーのグループ情報を取得
            const { data: groupUserData, error: groupUserError } =
              await supabase
                .from('trn_group_user')
                .select(`
                group_id
              `)
                .eq('user_id', application.user_id)
                .is('deleted_at', null);

            if (groupUserError) {
              console.error('Error fetching group user data:', groupUserError);
            }

            // グループ情報を取得
            let groupTitles: string[] = [];
            if (groupUserData && groupUserData.length > 0) {
              const groupIds = groupUserData.map((g) => g.group_id);
              const { data: groupData, error: groupError } = await supabase
                .from('mst_group')
                .select(`
                  group_id,
                  title
                `)
                .in('group_id', groupIds)
                .is('deleted_at', null);

              if (groupError) {
                console.error('Error fetching group data:', groupError);
              } else if (groupData) {
                groupTitles = groupData.map((g) => g.title);
              }
            }

            // スケジュール候補の取得
            const { data: candidateData, error: candidateError } =
              await supabase
                .from('trn_consultation_schedule_candidate')
                .select(`
            priority,
            candidate_id
          `)
                .eq('application_id', application.application_id)
                .is('deleted_at', null)
                .order('priority', { ascending: true });

            if (candidateError) {
              console.error('Error fetching candidate data:', candidateError);
            }

            // スケジュール候補の日時情報を取得
            const scheduleCandidates = await Promise.all(
              (candidateData || []).map(
                async (candidate: {
                  priority: number;
                  candidate_id: string;
                }) => {
                  const { data: scheduleData, error: scheduleError } =
                    await supabase
                      .from('mst_consultation_schedule')
                      .select(`
              schedule_id,
              schedule_datetime,
              consultation_id,
              created_at,
              updated_at,
              deleted_at
            `)
                      .eq('schedule_id', candidate.candidate_id)
                      .single();

                  if (scheduleError) {
                    console.error(
                      'Error fetching schedule data:',
                      scheduleError,
                    );
                    return null;
                  }

                  return {
                    ...scheduleData,
                    candidateRanking: candidate.priority,
                  };
                },
              ),
            );

            const participant = {
              application_id: application.application_id,
              user_id: application.user_id,
              username: userData?.username || null,
              email: userData?.email || '',
              phone_number: userData?.phone_number || null,
              company_name: userData?.company_name || null,
              company_name_kana: null,
              company_address: null,
              daihyosha_id: null,
              user_type: userData?.user_type || null,
              user_name_kana: null,
              user_position: null,
              icon: userData?.icon || null,
              bio: userData?.bio || null,
              website_url: null,
              social_media_links: null,
              industry_id: null,
              is_birth_date_visible: false,
              is_company_address_visible: false,
              is_company_name_kana_visible: false,
              is_email_visible: false,
              is_user_name_kana_visible: false,
              is_user_type_visible: false,
              is_user_position_visible: false,
              is_profile_public: false,
              is_bio_visible: false,
              is_company_name_visible: false,
              is_industry_id_visible: false,
              is_nickname_visible: false,
              is_phone_number_visible: false,
              is_social_media_links_visible: false,
              is_sns_visible: false,
              is_username_visible: false,
              is_website_url_visible: false,
              nickname: null,
              invite_link: null,
              last_login_at: null,
              last_payment_date: null,
              birth_date: null,
              building_name: null,
              city_address: null,
              my_asp_user_id: null,
              postal_code: null,
              prefecture: null,
              created_at: application.created_at || new Date().toISOString(),
              updated_at: null,
              deleted_at: null,
              priority: application.is_urgent ? 0 : 1,
              remarks: application.notes || '',
              firstTime: application.is_first_consultation,
              candidateDateAndTime: scheduleCandidates.filter(
                (c): c is NonNullable<typeof c> => c !== null,
              ),
              group_id: groupUserData?.[0]?.group_id || null,
              group_titles: groupTitles,
              selected_candidate_id: application.selected_candidate_id || null,
              consultation_id: params.individualConsultationId,
            };

            console.log('生成された参加者データ:', participant);
            return participant;
          },
        ),
      );

      return participants;
    } catch (error) {
      console.error('Error in getConsultationParticipants:', error);
      throw new Error('個別相談会の参加者情報の取得に失敗しました');
    }
  }

  // 並行して両方のデータを取得
  const [participants, consultationData] = await Promise.all([
    getConsultationParticipants(),
    getConsultationDetails(),
  ]);

  return (
    <Suspense fallback={<div className="text-center py-10">読み込み中...</div>}>
      <ParticipantsClientPage
        participants={participants}
        consultationData={consultationData}
        individualConsultationId={params.individualConsultationId}
      />
    </Suspense>
  );
}
