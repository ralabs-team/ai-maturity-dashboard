import PageHeader from '../components/layout/PageHeader';
import { ArrowRight, ExternalLink, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import SurveyAvatar from '../components/ui/SurveyAvatar';
import { SURVEYS } from '../data/surveys';
import { useSurveyData } from '../data/survey/SurveyDataContext';

function formatSurveyDate(value?: string): string {
  if (!value) return 'Not added yet';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function SurveysView() {
  const { hasResponseData } = useSurveyData();

  return (
    <div>
      <PageHeader
        title="Surveys"
        subtitle="Survey catalog with rollout details and core measurement dimensions."
        badge={SURVEYS.length}
      />

      {!hasResponseData ? (
        <div className="mb-5 rounded-2xl border border-[#bfdbfe] bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_100%)] p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center rounded-full border border-[#bfdbfe] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
                Next Step
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-[#1e3a8a]">
                  Run the surveys first, then upload the responses CSV.
                </h2>
                <p className="mt-2 max-w-[70ch] text-sm leading-6 text-[#475569]">
                  Start by sending these survey forms to participants. Once responses are ready,
                  go to the Responses page and upload the exported CSV files to unlock the dashboard.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-[#334155]">
                <div className="rounded-full border border-[#dbeafe] bg-white px-3 py-1.5">
                  1. Run the surveys
                </div>
                <div className="rounded-full border border-[#dbeafe] bg-white px-3 py-1.5">
                  2. Open Responses
                </div>
                <div className="rounded-full border border-[#dbeafe] bg-white px-3 py-1.5">
                  3. Upload the CSV results
                </div>
              </div>
            </div>

            <Link
              to="/data"
              className="inline-flex items-center gap-2 rounded-full border border-[#1d4ed8] bg-[#1d4ed8] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1e40af]"
            >
              Go to Responses
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        {SURVEYS.map((survey) => (
          <article
            key={survey.id}
            className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm transition-colors hover:border-[#d6d6d6]"
          >
            <div className="flex items-start gap-4">
              <SurveyAvatar
                surveyId={survey.id}
                label={survey.title}
                className="h-12 w-12"
                textClassName="text-sm"
              />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
                    {survey.title}
                  </h3>
                  {!hasResponseData ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#fafafa] px-3 py-1 text-xs font-medium text-[#475569]">
                      <Upload className="h-3.5 w-3.5" />
                      Upload results later on Responses
                    </div>
                  ) : null}
                  <p className="max-w-[58ch] text-sm leading-6 text-[#6b7280]">
                    {survey.description}
                  </p>
                  <a
                    href={survey.googleFormUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[#d9d9d9] bg-[#fafafa] px-3 py-1.5 text-sm font-medium text-[#242424] transition-colors hover:border-[#c8c8c8] hover:bg-white"
                  >
                    Open Google Form
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#fafafa] p-4">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b8b]">
                      Last Updated
                    </div>
                    <div className="mt-2 text-sm font-medium text-[#242424]">
                      {formatSurveyDate(survey.updatedAt)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#fafafa] p-4">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b8b]">
                      Questions
                    </div>
                    <div className="mt-2 text-sm font-medium text-[#242424]">
                      {survey.questionCountLabel}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
