import React from 'react';
import {
  AbsoluteFill, Audio, Composition, registerRoot, spring, staticFile,
  useCurrentFrame, useVideoConfig
} from 'remotion';
import {getAudioDurationInSeconds} from '@remotion/media-utils';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadPlayfair} from '@remotion/google-fonts/PlayfairDisplay';

const sans = loadInter('normal', {weights: ['500', '800'], subsets: ['latin']}).fontFamily;
const serif = loadPlayfair('normal', {weights: ['700'], subsets: ['latin']}).fontFamily;

const THEMES = {
  night:  {bg: '#101820', fg: '#f5f3ee', acc: '#ffd23f'},
  sunset: {bg: '#2a0f2e', fg: '#fff1e6', acc: '#ff6b6b'},
  mint:   {bg: '#0b2b26', fg: '#effff8', acc: '#5cf2b0'},
  light:  {bg: '#f3f4fa', fg: '#14141f', acc: '#5b3df5'}
};

const clamp = (x) => Math.max(0, Math.min(1, x));
const easeOut = (x) => 1 - Math.pow(1 - x, 3);

const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {frame, fps, t: frame / fps};
};

const Bg = ({th}) => {
  const {t} = useT();
  return (
    <AbsoluteFill style={{background: th.bg}}>
      <div style={{position: 'absolute', width: 800, height: 800, borderRadius: '50%', background: th.acc, opacity: 0.13,
        left: 1080 * 0.85 - 400 + Math.sin(t * 0.6) * 90, top: 1920 * 0.15 - 400 + Math.cos(t * 0.5) * 90}} />
      <div style={{position: 'absolute', width: 900, height: 900, borderRadius: '50%', background: th.acc, opacity: 0.08,
        left: 1080 * 0.1 - 450 + Math.cos(t * 0.4) * 75, top: 1920 * 0.88 - 450 + Math.sin(t * 0.55) * 75}} />
    </AbsoluteFill>
  );
};

/* ---- Quote / text ---- */
const Quote = ({f, th, dur}) => {
  const {t} = useT();
  const words = (f[0] || '').split(/\s+/).filter(Boolean);
  const step = Math.min(0.28, (dur * 0.65) / Math.max(1, words.length));
  const barP = easeOut(clamp(t / 0.8));
  const authorP = clamp((t - 0.5 - words.length * step - 0.2) / 0.6);
  return (
    <AbsoluteFill style={{padding: '0 105px', justifyContent: 'center'}}>
      <div style={{width: 225 * barP, height: 12, background: th.acc, marginBottom: 100}} />
      <div style={{display: 'flex', flexWrap: 'wrap', columnGap: '0.28em', fontFamily: serif, fontWeight: 700,
        fontSize: 92, lineHeight: 1.25, color: th.fg}}>
        {words.map((w, i) => {
          const p = clamp((t - 0.5 - i * step) / 0.45);
          return <span key={i} style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - easeOut(p)) * 45}px)`}}>{w}</span>;
        })}
      </div>
      {f[1] ? (
        <div style={{marginTop: 60, opacity: authorP, color: th.acc, fontFamily: sans, fontWeight: 500, fontSize: 50}}>
          {'\u2014 ' + f[1]}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ---- Explainer ---- */
const ROW_Y = [800, 1200, 1600];
const Icon = ({i, y, th, s}) => (
  <div style={{position: 'absolute', left: 225 - 83, top: y - 83, width: 166, height: 166, transform: `scale(${s})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{position: 'absolute', inset: 0, background: th.acc, borderRadius: i === 0 ? '50%' : 0,
      clipPath: i === 1 ? 'polygon(50% 0%, 100% 92%, 0% 92%)' : undefined}} />
    <span style={{position: 'relative', color: th.bg, fontFamily: sans, fontWeight: 800, fontSize: 68, marginTop: i === 1 ? 28 : 0}}>
      {i + 1}
    </span>
  </div>
);

const Explainer = ({f, th, dur}) => {
  const {frame, fps, t} = useT();
  const start = 1.4;
  const gap = Math.max(1.4, (dur - 3) / 3.2);
  const titleP = easeOut(clamp(t / 0.8));
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 105, top: 220, width: 870, fontFamily: sans, fontWeight: 800, fontSize: 84,
        lineHeight: 1.15, color: th.fg, opacity: titleP, transform: `translateY(${(1 - titleP) * -40}px)`}}>
        {f[0]}
      </div>
      {[0, 1].map((i) => {
        const p = easeOut(clamp((t - (start + i * gap + 0.5)) / 0.9));
        const h = (ROW_Y[i + 1] - ROW_Y[i] - 200) * p;
        return <div key={'l' + i} style={{position: 'absolute', left: 222, top: ROW_Y[i] + 100, width: 6, height: h, background: th.acc, opacity: 0.5}} />;
      })}
      {[0, 1, 2].map((i) => {
        const st = start + i * gap;
        if (t < st) return null;
        const s = spring({frame: frame - Math.round(st * fps), fps, config: {damping: 12}});
        const p = clamp((t - st) / 0.5);
        return (
          <React.Fragment key={i}>
            <Icon i={i} y={ROW_Y[i]} th={th} s={s} />
            <div style={{position: 'absolute', left: 380 + (1 - p) * 60, top: ROW_Y[i] - 100, width: 600, height: 200,
              display: 'flex', alignItems: 'center', fontFamily: sans, fontWeight: 500, fontSize: 60, lineHeight: 1.2,
              color: th.fg, opacity: p}}>
              {f[i + 1]}
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---- Promo ---- */
const Promo = ({f, th}) => {
  const {frame, fps, t} = useT();
  const bp = easeOut(clamp(t / 0.7));
  const hp = easeOut(clamp((t - 0.5) / 0.8));
  const cp = easeOut(clamp((t - 3.5) / 0.6));
  const pulse = 1 + 0.04 * Math.sin(t * 6) * cp;
  const badgeS = t >= 2 ? spring({frame: frame - 2 * fps, fps, config: {damping: 10}}) : 0;
  const badgeRot = (1 - clamp((t - 2) / 0.8)) * -50;
  return (
    <AbsoluteFill>
      {[-2, -1, 0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} style={{position: 'absolute', left: i * 210 + ((t * 60) % 210), top: 0, width: 105, height: 1920,
          background: th.fg, opacity: 0.07, transform: 'skewX(-14deg)'}} />
      ))}
      <div style={{position: 'absolute', left: 105 - (1 - bp) * 90, top: 190, fontFamily: sans, fontWeight: 800, fontSize: 58,
        color: th.acc, opacity: bp}}>
        {f[0]}
      </div>
      <div style={{position: 'absolute', left: 105, top: 420 + (1 - hp) * 70, width: 870, fontFamily: sans, fontWeight: 800,
        fontSize: 118, lineHeight: 1.1, color: th.fg, opacity: hp}}>
        {f[1]}
      </div>
      {t >= 2 ? (
        <div style={{position: 'absolute', right: 80, top: 1180, width: 400, height: 400, borderRadius: '50%', background: th.acc,
          display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 50,
          fontFamily: sans, fontWeight: 800, fontSize: 62, lineHeight: 1.1, color: th.bg,
          transform: `scale(${badgeS}) rotate(${badgeRot}deg)`}}>
          {f[2]}
        </div>
      ) : null}
      {cp > 0 ? (
        <div style={{position: 'absolute', left: 130, bottom: 190, width: 820, height: 160, borderRadius: 80, background: th.acc,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans, fontWeight: 800, fontSize: 64,
          color: th.bg, transform: `scale(${pulse * cp})`}}>
          {f[3]}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ---- Main video ---- */
const Video = (props) => {
  const th = THEMES[props.theme] || THEMES.night;
  const f = props.fields || [];
  const dur = props.durationSeconds || 8;
  const Scene = props.template === 'explainer' ? Explainer : props.template === 'promo' ? Promo : Quote;
  return (
    <AbsoluteFill>
      <Bg th={th} />
      <Scene f={f} th={th} dur={dur} />
      {props.hasVoice ? <Audio src={staticFile('voice.mp3')} /> : null}
    </AbsoluteFill>
  );
};

const Root = () => (
  <Composition
    id="Video"
    component={Video}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={240}
    defaultProps={{
      template: 'quote',
      theme: 'night',
      fields: ['Be so good they can\u2019t ignore you.', 'Steve Martin'],
      voiceover: '',
      hasVoice: false,
      durationSeconds: 8
    }}
    calculateMetadata={async ({props}) => {
      let seconds = props.durationSeconds || 8;
      if (props.hasVoice) {
        try {
          seconds = (await getAudioDurationInSeconds(staticFile('voice.mp3'))) + 1.5;
        } catch (e) {
          seconds = 10;
        }
      }
      seconds = Math.max(6, seconds);
      return {durationInFrames: Math.ceil(seconds * 30), props: {...props, durationSeconds: seconds}};
    }}
  />
);

registerRoot(Root);
