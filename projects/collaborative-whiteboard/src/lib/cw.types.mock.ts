import { DrawAction, DrawEvent, DrawEventsBroadcast, DrawTransport, Owner } from './cw.types';

const getNumber = (max = 1000) => Math.round(Math.random() * max);

const colors = ['1, 2, 3', '4, 5, 6', '7, 8, 9', '10, 11, 12', '13, 14, 15', '16, 17, 18'];

const getColor = () => colors[getNumber(colors.length - 1)];

export const getDrawEvent = (owner: Owner = ''): DrawEvent => ({
  type: 'point',
  data: [getNumber(), getNumber()],
  options: { lineWidth: getNumber(20), color: getColor(), opacity: 1 },
  owner,
});

export const getDrawEventsWithMapping = ({
  eventsNumber = 2,
  owner = '',
  action = 'add',
  animate = true,
}: {
  eventsNumber?: number;
  owner?: Owner;
  action?: DrawAction;
  animate?: boolean;
} = {}) => {
  const events = Array.from(Array(eventsNumber)).map(() => getDrawEvent(owner));
  const transport: DrawTransport = { action, events };
  const broadcast: DrawEventsBroadcast = { animate, events };
  return { events, transport, broadcast };
};
