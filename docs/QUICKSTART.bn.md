# Orbit ব্যবহার শুরু

Orbit তোমার সব mini app-এর জন্য একটি কেন্দ্রীয় analytics workspace।

প্রস্তুত আছে: Overview, Applications, Event explorer, Transaction ledger, ordered
Funnel builder ও saved journeys, Retention, Acquisition, CSV exports, SDK downloads,
Integration guide এবং private durable workspace।

## নিজের অ্যাপ যুক্ত করা

Workspace-এ শুধু নিজের নিবন্ধিত অ্যাপ এবং PostHog-এর আসল production events দেখা যাবে।
অ্যাপ যুক্ত করার আগে তালিকা খালি এবং count শূন্য থাকবে। `Set up PostHog` দিয়ে শুরু করো।

১. নিজের PostHog project তৈরি করো বা বিদ্যমান project ব্যবহার করো।
২. Orbit Settings-এ project ID, region ও public project token দাও।
৩. এই Site-এর server secret হিসেবে `POSTHOG_PERSONAL_API_KEY` configure করো।
   এটি সংশ্লিষ্ট PostHog project-এর `query:read` scoped key হবে; frontend-এ যাবে না।
৪. Orbit-এ নিজের app register করো।
   `Connect app`-এ নাম ও URL দাও, `Review application` দিয়ে যাচাই করে
   `Add application` চাপো। App ID নিজে তৈরি হবে। `Customize application` থেকে
   নিজের ID, network, category ও color বেছে নিতে পারবে।
৫. Integration guide থেকে SDK download করে অ্যাপে বসাও। Wallet ও transaction-এর
   বর্তমান code-এর সঙ্গে guide-এর example যুক্ত করো।
৬. PostHog Activity → Live events-এ event ও `app_id` যাচাই করো। তারপর Orbit-এর
   Production workspace দেখো। Dashboard শুধু `environment: 'production'` events পড়ে।
   Integration guide-এর `Check for events` দিয়ে নিজের অ্যাপের event যাচাই করতে পারবে।

Swap, mint, deposit, stake, transfer, approve, vote, bridge, purchase, claim কিংবা
অন্য contract action-এর জন্য একই `trackTransaction` ব্যবহার করা যাবে। Contact form
বা feedback-এর জন্য `formSubmitted` ব্যবহার করবে; field-এর লেখা পাঠাবে না।

## হিসাবের নিয়ম

- Active wallets = ওই সময়ের unique wallet addresses।
- Success rate = confirmed / (confirmed + failed); pending বাদ যায়।
- Funnel একই app ও একই visitor-এর ordered events দিয়ে হিসাব হয়।
- একই wallet দুই app-এ এলে মোট unique wallet-এ একবার, app-specific analysis-এ
  প্রতিটি app-এ আলাদা ধরা হয়।
- Retention-এর প্রথম দিন হলো loaded history-তে প্রথম দেখা দিন; lifetime first visit
  নিশ্চিত করতে সম্পূর্ণ historical data প্রয়োজন।
- Query সর্বোচ্চ ৫০,০০০ event পড়ে। সীমা ছুঁলে dashboard সতর্কতা দেখায়। তখন app
  filter বা ছোট date range ব্যবহার করো। Live read প্রতি দুই মিনিটে refresh হয়।
- Builder Code আগের মতো transaction-এ রাখতে হবে; SDK এটি যোগ করে না।
