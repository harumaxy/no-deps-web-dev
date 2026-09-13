import { html } from "htm/preact";
import { render } from "preact";
import { useState } from "preact/hooks";

// 月額 / 年額の切り替えだけが動的。年額は 2 ヶ月ぶんの割引。
const PLANS = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    note: "個人プロジェクトと検証用",
    featured: false,
    cta: "無料で始める",
    features: [
      "500 MB データベース",
      "1 GB ストレージ",
      "月間 50,000 アクティブユーザー",
      "プロジェクト 2 つまで",
      "コミュニティサポート",
    ],
  },
  {
    name: "Pro",
    monthly: 3500,
    yearly: 2900,
    note: "本番に出すチーム向け",
    featured: true,
    cta: "Pro を始める",
    features: [
      "8 GB データベース (超過は従量)",
      "100 GB ストレージ + CDN",
      "月間 100,000 アクティブユーザー",
      "日次バックアップ (7 日保持)",
      "メールサポート (2 営業日)",
    ],
  },
  {
    name: "Team",
    monthly: 12000,
    yearly: 9900,
    note: "複数チームでの共同運用",
    featured: false,
    cta: "Team を始める",
    features: [
      "32 GB データベース",
      "1 TB ストレージ",
      "PITR 14 日 + 監査ログ",
      "SSO / SAML と組織単位の権限",
      "稼働率 99.99% SLA",
    ],
  },
  {
    name: "Enterprise",
    monthly: null,
    yearly: null,
    note: "規模と要件に合わせて",
    featured: false,
    cta: "問い合わせる",
    features: [
      "専有インフラと BYOC",
      "PITR 最長 7 年",
      "専任サポート + 共有 Slack",
      "個別の SLA と契約",
      "オンプレミス / エアギャップ対応",
    ],
  },
];

const yen = (n) => `¥${n.toLocaleString("ja-JP")}`;

function Plans() {
  const [yearly, setYearly] = useState(true);

  return html`
    <p class="center">
      <label>
        <input
          type="checkbox"
          role="switch"
          checked="${yearly}"
          onChange="${(e) => setYearly(e.currentTarget.checked)}"
        />
        年払い (2 ヶ月ぶん割引)
      </label>
    </p>
    <div class="grid">
      ${PLANS.map((plan) => {
        const price = yearly ? plan.yearly : plan.monthly;
        return html`
          <article class="${plan.featured ? "plan invert" : "plan"}" key="${plan
            .name}">
            <hgroup>
              <h3>${plan.name}</h3>
              <p>${plan.note}</p>
            </hgroup>
            <p>
              <strong>${price === null
                ? "個別見積"
                : price === 0
                ? "¥0"
                : yen(price)}</strong>
              ${price
                ? html`
                  <small> / プロジェクト / 月</small>
                `
                : ""}
            </p>
            <ul>
              ${plan.features.map((f) =>
                html`
                  <li key="${f}">${f}</li>
                `
              )}
            </ul>
            <a href="/docs.html" role="button" class="${plan.featured
              ? ""
              : "outline"}">${plan.cta}</a>
          </article>
        `;
      })}
    </div>
  `;
}

const mount = document.getElementById("pricing");
if (mount) {
  render(
    html`
      <${Plans} />
    `,
    mount,
  );
}
