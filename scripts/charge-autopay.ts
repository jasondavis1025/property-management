import { runAutoPayCharges } from "../lib/stripe/autopay-charge";

async function main() {
  console.log("Running auto-pay charges…");
  const results = await runAutoPayCharges();
  console.log(JSON.stringify(results, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
