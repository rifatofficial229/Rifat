export const meta = {
  name: "lotto",
  description: "Test your luck with the lotto game!",
  version: "1.0.0",
  author: "Liane Cagara",
  usage: "{prefix}lotto <...numbers>",
  category: "Fun",
  permissions: [0],
  noPrefix: false,
  waitingTime: 15,
  requirement: "2.5.0",
  icon: "🔖",
};
export const style = {
  title: "Lotto 🔖",
  contentFont: "fancy",
  titleFont: "bold",
};
const fee = 100;
function hasDuplicate(args) {
  for (let i = 0; i < args.length; i++) {
    for (let j = i + 1; j < args.length; j++) {
      if (args[i] === args[j]) {
        return true;
      }
    }
  }
  return false;
}

export async function entry({ input, output, money, icon, cancelCooldown, Inventory }) {
  const lottoLen = 6;
  const rangeB = 170;
  const {
    money: userMoney,
    lastLottoWin,
    lottoLooses = 0,
    inv,
  } = await money.get(input.senderID);

  const inventory = new Inventory(inv ?? []);

  if (!inventory.has("lottoTicket")) {
    return output.reply(`A 🔖 **Lotto Ticket** is required to play every single game.`);
  }
    
  checkLottoWin: {
    if (isNaN(lastLottoWin)) {
      break checkLottoWin;
    }
    
    const interval = Date.now() - lastLottoWin;
    const timeElapsed = interval / 1000;
    if (timeElapsed < 60) {
      cancelCooldown();
      return output.reply(
        `⏳ You have already won the lottery in the last hour. Please wait for ${Math.ceil(
          60 - timeElapsed
        )} seconds before trying again.`
      );
    }
  }
  

  const args = input.arguments
    .map(Number)
    .filter((num) => !isNaN(num) && num > 0 && num < rangeB + 1);

  if (args.length !== lottoLen) {
    output.reply(
      `Please provide exactly ${lottoLen} valid numbers between 1 and ${rangeB}.`
    );
    cancelCooldown();
    return;
  }
  if (hasDuplicate(args)) {
    output.reply(`❌ Duplicate numbers are not allowed.`);
    cancelCooldown();
    return;
  }
  if (userMoney < fee) {
    return output.reply(`You don't have ${fee}$ to pay the lottery.`);
  }

  const crypto = require('crypto');

  function secureRandomInt(min, max) {
    const range = max - min + 1;
    const randomBytes = crypto.randomBytes(4);
    const randomInt = randomBytes.readUInt32BE(0);
    return min + (randomInt % range);
  }

  const lottoNumbers = Array.from(
    { length: lottoLen },
    () => secureRandomInt(1, rangeB)
  );

  const matchedNumbers = args.filter((num) => lottoNumbers.includes(num));
  let winnings;

  let resultText;
  if (matchedNumbers.length === 0) {
    resultText = `🥲 Sorry, no matched numbers. Better luck next time! (You lost your ${fee}$ as fee)`;
  } else {
    winnings = 8530 * 2 ** matchedNumbers.length;

    // each prize
    // = winnings >> matchedNumbers.length;
    resultText = `🎉 Congratulations! You won ${winnings}$.`;
  }

  const text = `**Lotto numbers**:
${lottoNumbers.join(", ")}\n**Your numbers**:
${args.join(", ")}\n\n${resultText}`;
  output.reply(`${text}`);

  if (matchedNumbers.length > 0 && winnings) {
    await money.set(input.senderID, {
      money: userMoney + winnings,
      lastLottoWin: Date.now(),
    });
  } else {
    await money.set(input.senderID, {
      money: userMoney - fee,
      lottoLooses: lottoLooses + fee,
    });
  }
}
