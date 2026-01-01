import OrderMailSend from "../../src/models/order-mail-send.js";

export async function getOrderMailSendSettings() {
  let settings = await OrderMailSend.findOne();
  if (!settings) settings = await OrderMailSend.create({});
  return settings;
}
