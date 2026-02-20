import React, { useState, useEffect, useCallback } from "react";

// ─── SUPABASE CONFIG ───
const SUPABASE_URL = "https://kuycllnrnjdfmcqpmsqs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1eWNsbG5ybmpkZm1jcXBtc3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDcwMDUsImV4cCI6MjA4NzEyMzAwNX0.mOUWM46Dv2j7smm4o1hq7UftnmNVGjN9OI6h7ugscxs";

// Lightweight Supabase REST client (no SDK needed)
const sb = {
  headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
  headersReturn: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
  async get(table, query = "") {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: this.headers });
      if (!r.ok) { console.warn(`SB GET ${table}:`, r.status); return []; }
      return await r.json();
    } catch(e) { console.warn("SB offline:", e.message); return []; }
  },
  async upsert(table, rows) {
    if (!rows || (Array.isArray(rows) && rows.length === 0)) return;
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST", headers: { ...this.headers, "Prefer": "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(Array.isArray(rows) ? rows : [rows])
      });
      if (!r.ok) console.warn(`SB UPSERT ${table}:`, r.status, await r.text());
    } catch(e) { console.warn("SB offline:", e.message); }
  },
  async del(table, match) {
    try {
      const params = Object.entries(match).map(([k,v]) => `${k}=eq.${v}`).join("&");
      await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { method: "DELETE", headers: this.headers });
    } catch(e) { console.warn("SB offline:", e.message); }
  }
};

// ─── COLORS ───
const C = {
  bg: "#0B1120", card: "#111827", cardBorder: "#1E293B",
  accent: "#10B981", accentDim: "rgba(16,185,129,0.12)",
  text: "#F1F5F9", textMuted: "#94A3B8", textDim: "#64748B",
  input: "#1E293B", inputBorder: "#334155", inputFocus: "#10B981",
  danger: "#F87171", dangerDim: "rgba(248,113,113,0.12)",
  warning: "#FBBF24", warningDim: "rgba(251,191,36,0.12)",
  divider: "#1E293B", gold: "#D4A843", goldDim: "rgba(212,168,67,0.10)",
  blue: "#60A5FA", blueDim: "rgba(96,165,250,0.12)",
  purple: "#A78BFA", purpleDim: "rgba(167,139,250,0.12)",
  teal: "#2DD4BF", tealDim: "rgba(45,212,191,0.12)",
  pass: "#10B981", fail: "#F87171",
  brand: "#10B981", brandDim: "rgba(16,185,129,0.08)",
};

const STATUSES = ["Pitched","CC","Docs Out","Appraisal Ordered","Sent to Lender","Approved","Submit CTC","CTC","Funded","Fallout"];
const STATUS_COLORS = {"Pitched":"#94A3B8","CC":"#60A5FA","Docs Out":"#A78BFA","Appraisal Ordered":"#FBBF24","Sent to Lender":"#F97316","Approved":"#10B981","Submit CTC":"#14B8A6","CTC":"#22C55E","Funded":"#A3E635","Fallout":"#F87171"};

// Statuses that have email templates
const EMAIL_STATUSES = ["Pitched","CC","Appraisal Ordered","Sent to Lender","Approved"];

const LENDERS = {
  FOA: {
    name: "Finance of America", short: "FOA", nmls: "NMLS #2285", color: C.blue, colorDim: C.blueDim,
    products: {
      HECM_ARM: {
        label: "HECM ARM", desc: "Monthly Adj · 5%/10% Life Cap · LOC/Term/Tenure · $5K Min Comp · Age 62+ · Excl NC",
        rateType: "arm", hasMIP: true, mipUpfront: 0.02, maxLoan: 1249125, minAge: 62, fullDraw: false,
        notes: "$0 lender credit. Comp $5K minimum. Premium paid on UPB. 10-day lock.",
        premiumGrid: {
          pluBands: ["0.01-10%","10.01-20%","20.01-30%","30.01-40%","40.01-50%","50.01-60%","60.01-70%","70.01-80%","80.01-90%","90.01-100%"],
          rows: [
            { margin:3.000, initRate:6.500, expRate:7.250, prems:[114.85,110.51,108.19,107.04,106.17,106.17,105.62,105.19,104.99,104.79] },
            { margin:2.875, initRate:6.375, expRate:7.125, prems:[114.85,110.51,108.19,107.04,106.17,106.17,105.62,105.19,104.99,104.79] },
            { margin:2.750, initRate:6.250, expRate:7.000, prems:[114.85,110.51,108.19,107.04,106.17,106.17,105.62,105.19,104.99,104.79] },
            { margin:2.625, initRate:6.125, expRate:6.875, prems:[114.22,110.26,108.19,107.04,106.17,106.17,105.62,105.19,104.99,104.79] },
            { margin:2.500, initRate:6.000, expRate:6.750, prems:[113.80,109.85,108.19,107.04,106.17,106.17,105.62,105.19,104.99,104.79] },
            { margin:2.375, initRate:5.875, expRate:6.625, prems:[112.18,108.76,107.90,106.55,105.87,106.00,105.37,104.90,104.85,104.68] },
            { margin:2.250, initRate:5.750, expRate:6.500, prems:[110.69,107.56,106.80,105.68,105.35,105.30,104.80,104.43,104.30,104.43] },
            { margin:2.125, initRate:5.625, expRate:6.375, prems:[108.69,105.76,105.55,104.93,104.43,104.68,104.43,104.05,103.85,103.93] },
            { margin:2.000, initRate:5.500, expRate:6.250, prems:[107.94,105.51,104.68,104.30,104.18,104.30,103.93,103.68,103.55,103.55] },
            { margin:1.875, initRate:5.375, expRate:6.125, prems:[104.94,103.26,103.18,103.18,103.30,103.43,103.05,102.93,102.93,102.80] },
            { margin:1.750, initRate:5.250, expRate:6.000, prems:[102.94,102.01,102.05,102.30,102.30,102.55,102.30,102.23,102.18,102.18] },
            { margin:1.625, initRate:5.125, expRate:5.875, prems:[100.94,101.01,101.43,101.55,101.68,101.80,101.68,101.55,101.55,101.55] },
            { margin:1.500, initRate:5.000, expRate:5.750, prems:[98.06,99.66,100.55,100.93,101.05,101.05,101.05,101.05,101.05,101.05] },
            { margin:1.375, initRate:4.875, expRate:5.625, prems:[96.56,97.56,99.25,99.75,100.25,100.25,100.25,100.25,100.25,100.25] },
            { margin:1.250, initRate:4.750, expRate:5.500, prems:[95.56,96.56,98.45,98.95,99.45,99.45,99.45,99.45,99.45,99.45] },
          ]
        },
        tiers: [
          { margin: 1.250, brokerComp: 0, lenderCredit: 0 },
          { margin: 1.375, brokerComp: 0, lenderCredit: 0 },
          { margin: 1.500, brokerComp: 0, lenderCredit: 0 },
          { margin: 1.625, brokerComp: 0, lenderCredit: 0 },
          { margin: 1.750, brokerComp: 0, lenderCredit: 0 },
          { margin: 1.875, brokerComp: 0, lenderCredit: 0 },
          { margin: 2.000, brokerComp: 0, lenderCredit: 0 },
          { margin: 2.125, brokerComp: 0, lenderCredit: 0 },
          { margin: 2.250, brokerComp: 0, lenderCredit: 0 },
          { margin: 2.375, brokerComp: 0, lenderCredit: 0 },
          { margin: 2.500, brokerComp: 0, lenderCredit: 0 },
          { margin: 2.625, brokerComp: 0, lenderCredit: 0 },
          { margin: 2.750, brokerComp: 0, lenderCredit: 0 },
          { margin: 2.875, brokerComp: 0, lenderCredit: 0 },
          { margin: 3.000, brokerComp: 0, lenderCredit: 0 },
        ],
      },
      HECM_FIXED: {
        label: "HECM Fixed", desc: "Fixed · Lump Sum · Orig Fee to FOA · UPB ≥60% PL · $5K Min Comp · Excl NC",
        rateType: "fixed", hasMIP: true, mipUpfront: 0.02, maxLoan: 1249125, minAge: 62, fullDraw: true,
        premium: 103.00,
        notes: "Fixed Rate HECM not available for initial UPB less than 60% of PL. Origination fee payable to FOA. $0 lender credit.",
        tiers: [
          { margin: 0, noteRate: 7.560, brokerComp: 0, lenderCredit: 0, label: "7.560%", origFee: 6000 },
          { margin: 0, noteRate: 7.680, brokerComp: 0, lenderCredit: 0, label: "7.680%", origFee: 4250 },
          { margin: 0, noteRate: 7.810, brokerComp: 0, lenderCredit: 0, label: "7.810%", origFee: 3000 },
          { margin: 0, noteRate: 7.930, brokerComp: 0, lenderCredit: 0, label: "7.930%", origFee: 2000 },
        ],
      },
      HOMESAFE: {
        label: "HomeSafe Std", desc: "Proprietary · Fixed Lump Sum · $200K–$4M · $5K Min Comp",
        rateType: "fixed_prop", hasMIP: false, mipUpfront: 0, maxLoan: 4000000, minLoan: 200000, minAge: 55, fullDraw: true,
        premium: 103.00,
        states55: "AZ,CA,CO,CT,DC,FL,GA,HI,ID,IL,LA,MI,MN,MO,MT,NV,NJ,NC,OH,OR,PA,RI,SC,UT,VA",
        states60: "MA,NY,WA", states62: "TX",
        notes: "Tier 1 & 3 not eligible in UT. MO orig fees capped at 2%.",
        tiers: [
          { margin: 0, noteRate: 7.990, lesaRate: 8.240, origPctToFOA: 1.0, brokerComp: 0, lenderCredit: 0, label: "Tier 1 · 7.990% (1% PL to FOA)" },
          { margin: 0, noteRate: 8.950, lesaRate: 9.200, origPctToFOA: 0.0, brokerComp: 0, lenderCredit: 0, label: "Tier 2 · 8.950% (0% Orig)" },
          { margin: 0, noteRate: 8.980, lesaRate: 9.230, origPctToFOA: 2.0, brokerComp: 0, lenderCredit: 0, label: "Tier 3 · 8.980% (2% PL to FOA)" },
        ],
      },
      HOMESAFE_INTRO: {
        label: "HomeSafe Intro", desc: "Proprietary · Fixed · 1st Time Rev Mtg · $200K–$4M · $5K Min Comp",
        rateType: "fixed_prop", hasMIP: false, mipUpfront: 0, maxLoan: 4000000, minLoan: 200000, minAge: 55, fullDraw: true,
        premium: 103.00,
        states55: "AZ,CA,CO,CT,DC,FL,GA,HI,ID,IL,LA,MI,MT,NV,NJ,NC,OH,OR,PA,RI,SC,VA",
        states60: "MA,NY,WA", states62: "TX",
        notes: "Not offered if borrower has an active reverse mortgage. Excl MN, MO, NY, UT.",
        tiers: [
          { margin: 0, noteRate: 8.990, lesaRate: 9.240, origPctToFOA: 4.0, brokerComp: 0, lenderCredit: 0, label: "Intro · 8.990% (4% PL to FOA)" },
        ],
      },
      HOMESAFE_SELECT: {
        label: "HS Select", desc: "Proprietary · ARM LOC · Growth Rate · $200K–$4M · 1.5% PL to Broker (Cap $20K)",
        rateType: "arm_prop", hasMIP: false, mipUpfront: 0, maxLoan: 4000000, minLoan: 200000, minAge: 55, fullDraw: false,
        rateFloor: "Greater of start rate - 1.50% or 5.50%",
        states55: "AZ,CA,CO,CT,DC,FL,GA,HI,ID,IL,LA,MI,MN,MO,MT,NC,NJ,NV,OH,OR,PA,RI,SC,UT,VA",
        states60: "MA,NY,WA", states62: "TX",
        tiers: [
          { margin: 5.749, lesaMargin: 5.999, prem25_80: 105.00, prem80_90: 103.50, prem90_100: 102.25, brokerComp: 0, lenderCredit: 0 },
          { margin: 5.625, lesaMargin: 5.875, prem25_80: 104.25, prem80_90: 103.00, prem90_100: 102.00, brokerComp: 0, lenderCredit: 0 },
          { margin: 5.499, lesaMargin: 5.751, prem25_80: 103.50, prem80_90: 102.25, prem90_100: 101.75, brokerComp: 0, lenderCredit: 0 },
        ],
      },
      HOMESAFE_SELECT_INTRO: {
        label: "HS Sel Intro", desc: "Proprietary · ARM LOC · 1st Time · $200K–$4M · PLU Cap 90% · 1.5% MCA to Broker (Cap $20K)",
        rateType: "arm_prop", hasMIP: false, mipUpfront: 0, maxLoan: 4000000, minLoan: 200000, minAge: 55, fullDraw: false,
        rateFloor: "Greater of start rate - 1.50% or 5.50%",
        states55: "AZ,CA,CO,CT,DC,FL,GA,HI,ID,IL,LA,MI,MN,MO,MT,NJ,NV,OH,OR,RI,SC,UT,VA",
        states60: "MA", states62: "TX",
        notes: "Not offered if borrower has an active reverse mortgage. PLU capped at 90%.",
        tiers: [
          { margin: 5.750, lesaMargin: 6.000, prem25_80: 103.50, prem80_90: 102.25, prem90_100: null, brokerComp: 0, lenderCredit: 0 },
          { margin: 5.625, lesaMargin: 5.875, prem25_80: 102.75, prem80_90: 101.50, prem90_100: null, brokerComp: 0, lenderCredit: 0 },
        ],
      },
      HOMESAFE_SECOND: {
        label: "HS Second", desc: "Proprietary · Fixed 2nd Lien · $50K–$1M · Flat $3,995 Orig to FOA · $5K Min Comp",
        rateType: "fixed_prop", hasMIP: false, mipUpfront: 0, maxLoan: 1000000, minLoan: 50000, minAge: 55, fullDraw: true,
        premium: 103.00,
        states55: "AZ,CA,CO,CT,FL,IL,MT,NV,OR,SC,UT",
        states60: "WA", states62: "TX",
        notes: "WA: Orig 4% of first $20K + 2% remainder, cap $3,995. SC: No orig, no min comp. CT: Prepaid charges ≤8% initial UPB. UT: $70K min PL.",
        tiers: [
          { margin: 0, noteRate: 8.990, brokerComp: 0, lenderCredit: 0, label: "Tier 1 · 8.990%" },
          { margin: 0, noteRate: 9.490, brokerComp: 0, lenderCredit: 0, label: "Tier 2 · 9.490%" },
        ],
      },
    },
  },
  MOM: {
    name: "Mutual of Omaha", short: "MoO", nmls: "NMLS #1025894", color: C.purple, colorDim: C.purpleDim,
    products: {
      HECM_ARM: {
        label: "HECM ARM", desc: "Monthly Adj · 1Y CMT 5 Cap · Orig $0–$30K to MoO",
        rateType: "arm", hasMIP: true, mipUpfront: 0.02, maxLoan: 1249125, minAge: 62, fullDraw: false,
        notes: "Orig fee $0–$30K. Premium on UPB. Floor = greater of (start rate - 1.5%) or 5.5%. All files over-disclosed to max premium for given margin at application.",
        premiumGrid: {
          pluBands: ["0-10%","10.01-20%","20.01-30%","30.01-40%","40.01-50%","50.01-60%","60.01-70%","70.01-80%","80.01-90%","90.01-100%"],
          rows: [
            { margin:3.000, initRate:6.375, expRate:7.125, prems:[112.625,108.875,107.000,105.875,105.125,104.875,104.375,103.875,103.625,103.500] },
            { margin:2.875, initRate:6.250, expRate:7.000, prems:[112.500,108.875,107.125,106.000,105.125,104.875,104.375,104.125,103.875,103.625] },
            { margin:2.750, initRate:6.125, expRate:6.875, prems:[112.125,108.875,107.500,106.375,105.625,105.625,104.875,104.625,104.375,104.125] },
            { margin:2.625, initRate:6.000, expRate:6.750, prems:[111.375,108.500,107.875,106.750,105.875,105.750,105.125,104.875,104.500,104.375] },
            { margin:2.500, initRate:5.875, expRate:6.625, prems:[111.250,108.125,108.250,107.125,106.250,106.000,105.375,104.875,105.125,104.875] },
            { margin:2.375, initRate:5.750, expRate:6.500, prems:[109.625,107.250,108.000,106.625,106.000,106.000,105.375,104.875,104.875,104.750] },
            { margin:2.250, initRate:5.625, expRate:6.375, prems:[108.125,105.875,106.875,105.750,105.425,105.375,104.875,104.500,104.375,104.500] },
            { margin:2.125, initRate:5.500, expRate:6.250, prems:[106.250,104.125,105.625,105.000,104.500,104.750,104.500,104.125,103.875,104.000] },
            { margin:2.000, initRate:5.375, expRate:6.125, prems:[103.875,103.000,104.375,104.250,104.500,104.375,104.000,103.750,103.625,103.625] },
            { margin:1.875, initRate:5.250, expRate:6.000, prems:[100.375,101.125,103.250,103.375,103.500,103.125,103.000,103.000,102.875,102.875] },
            { margin:1.750, initRate:5.125, expRate:5.875, prems:[98.125,100.125,102.125,102.375,102.625,102.375,102.250,102.250,102.250,102.250] },
            { margin:1.625, initRate:5.000, expRate:5.750, prems:[96.000,97.750,101.500,101.625,101.750,101.625,101.625,101.625,101.625,101.625] },
            { margin:1.500, initRate:4.875, expRate:5.625, prems:[93.500,96.500,100.500,101.000,101.000,101.000,101.000,101.000,101.000,101.000] },
            { margin:1.375, initRate:4.750, expRate:5.500, prems:[92.625,95.625,99.875,100.375,100.375,100.375,100.375,100.375,100.375,100.375] },
            { margin:1.250, initRate:4.625, expRate:5.375, prems:[91.875,94.875,99.125,99.125,99.125,99.125,99.125,99.125,99.125,99.125] },
          ]
        },
        tiers: [
          { margin: 1.250, brokerComp: 0, lenderCredit: 0 },
          { margin: 1.375, brokerComp: 0, lenderCredit: 0 },
          { margin: 1.500, brokerComp: 0, lenderCredit: 0 },
          { margin: 1.625, brokerComp: 0, lenderCredit: 0 },
          { margin: 1.750, brokerComp: 0, lenderCredit: 0 },
          { margin: 1.875, brokerComp: 0, lenderCredit: 0 },
          { margin: 2.000, brokerComp: 0, lenderCredit: 0 },
          { margin: 2.125, brokerComp: 0, lenderCredit: 0 },
          { margin: 2.250, brokerComp: 0, lenderCredit: 0 },
          { margin: 2.375, brokerComp: 0, lenderCredit: 0 },
          { margin: 2.500, brokerComp: 0, lenderCredit: 0 },
          { margin: 2.625, brokerComp: 0, lenderCredit: 0 },
          { margin: 2.750, brokerComp: 0, lenderCredit: 0 },
          { margin: 2.875, brokerComp: 0, lenderCredit: 0 },
          { margin: 3.000, brokerComp: 0, lenderCredit: 0 },
        ],
      },
      SECURE_EQUITY_FIXED_PLUS: {
        label: "SE Fixed Plus", desc: "Proprietary · Fixed · $200K Min PL · 4% Orig to MoO (No Max)",
        rateType: "fixed_prop", hasMIP: false, mipUpfront: 0, maxLoan: 4000000, minLoan: 200000, minAge: 55, fullDraw: true,
        premium: 103.00,
        statesFixed: "AL,AR,AZ,CA,CO,CT,DC,DE,FL,GA,HI,ID,IL,IN,LA,MI,MO,MT,NC,NH,NJ,NM,NV,OH,OK,OR,PA,RI,SC,TX,UT,VA,WA,WY",
        notes: "4% origination fee on principal limit payable to MoO, no maximum. Premium on UPB.",
        tiers: [
          { margin: 0, noteRate: 8.990, lesaRate: 9.240, origPctToMoO: 4.0, brokerComp: 0, lenderCredit: 0, label: "Fixed Plus · 8.990% (4% PL to MoO)" },
        ],
      },
      SECURE_EQUITY_FIXED: {
        label: "SE Fixed", desc: "Proprietary · Fixed · $200K Min PL · 1% Orig to MoO (Cap $30K)",
        rateType: "fixed_prop", hasMIP: false, mipUpfront: 0, maxLoan: 4000000, minLoan: 200000, minAge: 55, fullDraw: true,
        premium: 103.00,
        statesFixed: "AL,AR,AZ,CA,CO,CT,DC,DE,FL,GA,HI,ID,IL,IN,LA,MI,MO,MT,NC,NH,NJ,NM,NV,OH,OK,OR,PA,RI,SC,TX,UT,VA,WA,WY",
        notes: "1% origination fee on principal limit payable to MoO, max $30K. ** Tier 1 = Lower Rate / Lower LTV. Premium on UPB.",
        tiers: [
          { margin: 0, noteRate: 8.740, lesaRate: 8.990, origPctToMoO: 1.0, brokerComp: 0, lenderCredit: 0, label: "**Tier 1 · 8.740% (Lower Rate/LTV)" },
          { margin: 0, noteRate: 8.950, lesaRate: 9.200, origPctToMoO: 1.0, brokerComp: 0, lenderCredit: 0, label: "Tier 2 · 8.950%" },
        ],
      },
      SECURE_EQUITY_ARM: {
        label: "SE ARM", desc: "Proprietary · ARM LOC · $200K Min PL · Orig to Broker (Cap $30K)",
        rateType: "arm_prop", hasMIP: false, mipUpfront: 0, maxLoan: 4000000, minLoan: 200000, minAge: 55, fullDraw: false,
        rateFloor: "Greater of start rate - 1.50% or 5.50%",
        statesAdj: "AL,AR,AZ,CA,CO,CT,DC,DE,FL,GA,HI,ID,IL,IN,LA,MI,MO,MT,NC,NH,NJ,NM,NV,OH,OK,OR,RI,SC,TX,UT,VA,WY",
        notes: "Orig fee payable to broker, at broker's discretion. Cap $30K, min $0. Premium on UPB.",
        tiers: [
          { margin: 5.749, lesaMargin: 5.999, prem25_80: 103.500, prem80_90: 102.250, prem90_100: 101.250, brokerComp: 0, lenderCredit: 0 },
          { margin: 5.875, lesaMargin: 6.125, prem25_80: 104.250, prem80_90: 103.000, prem90_100: 102.000, brokerComp: 0, lenderCredit: 0 },
          { margin: 6.000, lesaMargin: 6.250, prem25_80: 105.000, prem80_90: 103.500, prem90_100: 102.250, brokerComp: 0, lenderCredit: 0 },
          { margin: 6.125, lesaMargin: 6.375, prem25_80: 105.125, prem80_90: 103.875, prem90_100: 102.500, brokerComp: 0, lenderCredit: 0 },
          { margin: 6.250, lesaMargin: 6.500, prem25_80: 105.250, prem80_90: 104.125, prem90_100: 102.750, brokerComp: 0, lenderCredit: 0 },
        ],
      },
    },
  },
};

const HECM_LIMIT = 1249125;
const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

// ─── HELPERS ───
const calcAge = (d) => { if (!d) return null; const b = new Date(d), t = new Date(); let a = t.getFullYear() - b.getFullYear(); if (t.getMonth() - b.getMonth() < 0 || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--; return a; };
const getPLF = (age, er, isProp) => {
  if (isProp) {
    if (age < 55) return null;
    const base = { 55: .300, 56: .305, 57: .310, 58: .315, 59: .320, 60: .325, 61: .330, 62: .336, 63: .342, 64: .348, 65: .354, 66: .361, 67: .368, 68: .375, 69: .382, 70: .390, 71: .398, 72: .406, 73: .414, 74: .423, 75: .432, 76: .441, 77: .451, 78: .461, 79: .471, 80: .482, 81: .493, 82: .505, 83: .517, 84: .529, 85: .542, 86: .555, 87: .568, 88: .582, 89: .596, 90: .610 };
    const a = Math.min(age, 90), bf = base[a]; if (!bf) return null;
    return Math.max(0.10, Math.min(0.70, bf + (6.0 - er) * 0.015));
  }
  const base = { 62: .418, 63: .424, 64: .430, 65: .436, 66: .443, 67: .449, 68: .456, 69: .463, 70: .470, 71: .478, 72: .486, 73: .494, 74: .503, 75: .512, 76: .522, 77: .532, 78: .543, 79: .554, 80: .566, 81: .578, 82: .591, 83: .604, 84: .618, 85: .632, 86: .647, 87: .662, 88: .677, 89: .692, 90: .707, 91: .714, 92: .721, 93: .728, 94: .735, 95: .742, 96: .749, 97: .756, 98: .763, 99: .770 };
  if (age < 62) return null; const a = Math.min(age, 99), bf = base[a]; if (!bf) return null;
  return Math.min(0.80, Math.max(0.15, bf + (5.0 - er) * 0.02));
};
const fmt = (v) => (v == null || isNaN(v)) ? "$0.00" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
const fmtShort = (v) => { if (!v || isNaN(v)) return "$0"; if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`; return fmt(v); };
const pn = (v) => parseFloat((v || "").toString().replace(/[^0-9.]/g, "")) || 0;

// ─── EMAIL TEMPLATE GENERATOR ───
function generateEmail(status, deal, extraFields) {
  const name = deal.name || "Client";
  const firstName = name.split(" ")[0];
  switch (status) {
    case "Pitched":
      return {
        subject: `Great Speaking With You, ${firstName} — Appointment Confirmation`,
        body: `Hi ${firstName},\n\nThank you so much for taking the time to speak with me today — I truly enjoyed our conversation and learning more about your goals.\n\nI'd like to confirm our upcoming appointment:\n\n📅 Date & Time: ${extraFields.appointmentDate || "[Date/Time]"}\n📍 Meeting: ${extraFields.appointmentType || "Phone consultation"}\n\nDuring our meeting, we'll review:\n\n• Your current reverse mortgage and how a HECM-to-HECM refinance could benefit you\n• How the updated home value and current rates may increase your available funds\n• A side-by-side comparison of your existing loan vs. what's available today\n• Estimated proceeds and potential cash available to you\n• The full timeline and next steps so there are no surprises\n\nIf you have any questions before we meet, don't hesitate to reach out. I'm here to help every step of the way.\n\nLooking forward to it!\n\nWarm regards,\nReece\nReverse by Reece`
      };
    case "CC":
      return {
        subject: `Counseling Update — Next Steps for Your Refinance, ${firstName}`,
        body: `Hi ${firstName},\n\nGreat news — I've sent your information over to the HUD-approved counseling agency. You should be hearing from them shortly to schedule your counseling session.\n\nHere's what to expect:\n\n1. The counselor will reach out to schedule a phone session (typically 30–45 minutes)\n2. They'll review the basics of the reverse mortgage refinance process with you\n3. Once completed, they'll issue a Counseling Certificate\n4. After we receive your certificate, we'll move forward with your application and order the appraisal\n\nThis is a required step in the process and is designed to make sure you feel confident and informed about your decision. It's nothing to stress about — it's really just a conversation.\n\nIf the counselor asks you anything you're unsure about, feel free to call me and I'll walk you through it.\n\nWe're making great progress — talk soon!\n\nBest,\nReece\nReverse by Reece`
      };
    case "Appraisal Ordered":
      return {
        subject: `Appraisal Scheduled — Your Refinance Is Moving Forward, ${firstName}!`,
        body: `Hi ${firstName},\n\nExciting update — your appraisal has been ordered!\n\n📅 Appraisal Date: ${extraFields.appraisalDate || "[Date]"}\n📋 Estimated Report ETA: ${extraFields.appraisalETA || "7–10 business days after inspection"}\n\nThe appraiser will visit your home to assess its current market value. Here are a few tips to prepare:\n• The home should be generally clean and accessible\n• Make sure all areas of the home can be accessed (garage, attic, crawl space if applicable)\n• No major repairs are needed — they're just documenting the condition and value\n\nWhile we wait for the appraisal report, here are a few items we'll need to move toward underwriting:\n\n${extraFields.itemsNeeded || "• Copy of homeowner's insurance declarations page\n• Most recent property tax statement\n• Government-issued photo ID\n• Any HOA documentation (if applicable)"}\n\nYour refinance is well on its way — we're making real progress here! If you have any questions at all, don't hesitate to reach out.\n\nBest,\nReece\nReverse by Reece`
      };
    case "Sent to Lender":
      return {
        subject: `Appraisal Report In — File Submitted to Lender, ${firstName}`,
        body: `Hi ${firstName},\n\nI have a great update for you — your appraisal report has come back and I've reviewed the results. Everything is looking good.\n\nI've now submitted your complete file to the lender for underwriting review. Here's what happens next:\n\n1. The lender's underwriting team will review your full application package\n2. They'll verify the appraisal, title, and all documentation\n3. We typically hear back within 5–10 business days with a decision\n4. If they need any additional items, I'll reach out to you right away\n\nYou're doing an amazing job keeping this process moving — we're in the home stretch!\n\nI'll keep you posted as soon as I hear anything. In the meantime, feel free to reach out with any questions.\n\nBest,\nReece\nReverse by Reece`
      };
    case "Approved":
      return {
        subject: `Congratulations — Your Refinance Has Been Approved, ${firstName}! 🎉`,
        body: `Hi ${firstName},\n\nI'm thrilled to share the great news — your reverse mortgage refinance has been approved!\n\nHere's what we need to finalize and get to the closing table:\n\n📋 Outstanding Items Needed:\n${extraFields.itemsNeeded || "• Signed intent to proceed\n• Updated homeowner's insurance with new lender as mortgagee\n• Any outstanding conditions from underwriting\n• Confirmation of counseling certificate (if not already on file)"}\n\n📅 Estimated Timeline:\n• Once all items are received: 3–5 business days to clear to close\n• Closing can typically be scheduled within 1 week after CTC\n• ${extraFields.closingNote || "We'll coordinate with the title company/notary for a time and place that works for you"}\n\nYou've been wonderful to work with throughout this entire process, and I'm so glad we were able to get this done for you. If you have any questions about the final steps, I'm just a call or email away.\n\nLet's bring this home!\n\nWarm regards,\nReece\nReverse by Reece`
      };
    default:
      return null;
  }
}

// ─── SMALL COMPONENTS ───
function Inp({ label, value, onChange, type = "text", prefix, suffix, hint, id, small, placeholder }) {
  return (<div style={{ marginBottom: small ? 10 : 16 }}>
    <label htmlFor={id} style={{ display: "block", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMuted, marginBottom: 3, fontFamily: "'DM Sans',sans-serif" }}>{label}</label>
    <div style={{ position: "relative" }}>
      {prefix && <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textDim, fontSize: 13, fontFamily: "'DM Mono',monospace", pointerEvents: "none" }}>{prefix}</span>}
      <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ width: "100%", boxSizing: "border-box", padding: prefix ? "9px 10px 9px 24px" : "9px 10px", paddingRight: suffix ? 40 : 10, background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 7, color: C.text, fontSize: 13, fontFamily: "'DM Mono',monospace", outline: "none" }} onFocus={e => { e.target.style.borderColor = C.inputFocus; }} onBlur={e => { e.target.style.borderColor = C.inputBorder; }} />
      {suffix && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: C.textDim, fontSize: 10 }}>{suffix}</span>}
    </div>
    {hint && <span style={{ fontSize: 9, color: C.textDim, marginTop: 1, display: "block" }}>{hint}</span>}
  </div>);
}
function Sel({ label, value, onChange, options, id }) {
  return (<div style={{ marginBottom: 10 }}>
    <label htmlFor={id} style={{ display: "block", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMuted, marginBottom: 3 }}>{label}</label>
    <select id={id} value={value} onChange={onChange} style={{ width: "100%", boxSizing: "border-box", padding: "9px 10px", background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 7, color: C.text, fontSize: 13, fontFamily: "'DM Mono',monospace", outline: "none" }}>
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>);
}
function Row({ label, value, color, bold, border }) { return (<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: bold ? "10px 0" : "6px 0", borderBottom: border ? `1px solid ${C.divider}` : "none" }}><span style={{ fontSize: bold ? 11 : 10, color: C.textMuted, fontWeight: bold ? 600 : 400, maxWidth: "55%" }}>{label}</span><span style={{ fontSize: bold ? 16 : 12, fontWeight: bold ? 700 : 500, color: color || C.text, fontFamily: "'DM Mono',monospace", textAlign: "right" }}>{value}</span></div>); }
function Badge({ children, color, bg }) { return <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 600, color, background: bg, letterSpacing: "0.03em", whiteSpace: "nowrap" }}>{children}</span>; }
function TestResult({ label, pass, detail }) { return (<div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 0", borderBottom: `1px solid ${C.divider}` }}><div style={{ width: 22, height: 22, borderRadius: 5, background: pass ? C.accentDim : C.dangerDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{pass ? "✓" : "✗"}</div><div style={{ flex: 1 }}><div style={{ fontSize: 11, fontWeight: 600, color: pass ? C.pass : C.fail }}>{label}</div><div style={{ fontSize: 9, color: C.textDim, marginTop: 1 }}>{detail}</div></div></div>); }
function Hdr({ children }) { return <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textDim, marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${C.divider}` }}>{children}</div>; }
function Card({ children, style }) { return <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: 16, marginBottom: 10, ...style }}>{children}</div>; }
function Btn({ children, onClick, primary, danger, small, style: s }) { return <button onClick={onClick} style={{ padding: small ? "5px 10px" : "9px 16px", borderRadius: 7, border: "none", background: danger ? C.danger : primary ? C.accent : "rgba(255,255,255,0.08)", color: danger ? "#fff" : primary ? "#000" : C.text, fontSize: small ? 10 : 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", ...s }}>{children}</button>; }

// ─── EMAIL MODAL ───
function EmailModal({ status, deal, onClose }) {
  const [extra, setExtra] = useState({
    appointmentDate: "", appointmentType: "Phone consultation",
    appraisalDate: "", appraisalETA: "7–10 business days after inspection",
    itemsNeeded: "", closingNote: "",
  });
  const [sent, setSent] = useState(false);

  const email = generateEmail(status, deal, extra);
  if (!email) return null;

  const mailtoLink = `mailto:${deal.email || ""}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, maxWidth: 520, width: "100%", maxHeight: "90vh", overflow: "auto", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>📧 {status} Email</div>
            <div style={{ fontSize: 10, color: C.textDim }}>for {deal.name} (ID: {deal.leadId})</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* Extra fields based on status */}
        {status === "Pitched" && (<>
          <Inp small id="apt" label="Appointment Date & Time" value={extra.appointmentDate} onChange={e => setExtra(p => ({ ...p, appointmentDate: e.target.value }))} placeholder="e.g. Thursday, Feb 20 at 2:00 PM" />
          <Inp small id="atype" label="Meeting Type" value={extra.appointmentType} onChange={e => setExtra(p => ({ ...p, appointmentType: e.target.value }))} placeholder="Phone, Zoom, In-Person" />
        </>)}
        {status === "Appraisal Ordered" && (<>
          <Inp small id="apd" label="Appraisal Date" value={extra.appraisalDate} onChange={e => setExtra(p => ({ ...p, appraisalDate: e.target.value }))} placeholder="e.g. Monday, Feb 24" />
          <Inp small id="ape" label="Report ETA" value={extra.appraisalETA} onChange={e => setExtra(p => ({ ...p, appraisalETA: e.target.value }))} placeholder="7-10 business days" />
          <Inp small id="items1" label="Items Needed for UW (one per line)" value={extra.itemsNeeded} onChange={e => setExtra(p => ({ ...p, itemsNeeded: e.target.value }))} placeholder="• Insurance dec page\n• Tax statement" />
        </>)}
        {status === "Approved" && (<>
          <Inp small id="items2" label="Outstanding Items (one per line)" value={extra.itemsNeeded} onChange={e => setExtra(p => ({ ...p, itemsNeeded: e.target.value }))} placeholder="• Signed intent to proceed\n• Updated insurance" />
          <Inp small id="cnote" label="Closing Note" value={extra.closingNote} onChange={e => setExtra(p => ({ ...p, closingNote: e.target.value }))} placeholder="Additional scheduling info" />
        </>)}

        {/* Preview */}
        <div style={{ marginTop: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, marginBottom: 4 }}>PREVIEW</div>
          <div style={{ background: C.input, borderRadius: 8, padding: 12, maxHeight: 260, overflow: "auto" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.blue, marginBottom: 6 }}>Subject: {generateEmail(status, deal, extra)?.subject}</div>
            <pre style={{ fontSize: 10, color: C.text, whiteSpace: "pre-wrap", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5, margin: 0 }}>
              {generateEmail(status, deal, extra)?.body}
            </pre>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <a href={mailtoLink} target="_blank" rel="noopener noreferrer" onClick={() => setSent(true)} style={{ flex: 1, padding: "10px 16px", borderRadius: 7, background: C.accent, color: "#000", fontSize: 12, fontWeight: 600, textAlign: "center", textDecoration: "none", cursor: "pointer" }}>
            Open in Mail App
          </a>
          <button onClick={() => { navigator.clipboard.writeText(`Subject: ${generateEmail(status, deal, extra)?.subject}\n\n${generateEmail(status, deal, extra)?.body}`); setSent(true); }} style={{ flex: 1, padding: "10px 16px", borderRadius: 7, background: "rgba(255,255,255,0.08)", border: "none", color: C.text, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            📋 Copy to Clipboard
          </button>
        </div>
        {sent && <div style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: C.accent }}>✓ Ready to send!</div>}
      </div>
    </div>
  );
}

// ─── MAIN APP ───
export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);
  const [mfaStep, setMfaStep] = useState(0); // 0=passcode, 1=email input, 2=sending, 3=code entry
  const [mfaEmail, setMfaEmail] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaInput, setMfaInput] = useState("");
  const [mfaError, setMfaError] = useState(false);
  const [mfaCountdown, setMfaCountdown] = useState(300);
  const [mfaSendDots, setMfaSendDots] = useState("");

  // MFA helpers
  const maskEmail = (email) => {
    if (!email) return "";
    const [user, domain] = email.split("@");
    if (!domain) return email;
    const masked = user.length <= 2 ? user[0] + "•••" : user.slice(0, 2) + "•".repeat(Math.min(user.length - 2, 6));
    return masked + "@" + domain;
  };
  const sendMfaEmail = () => {
    if (!mfaEmail || !mfaEmail.includes("@")) return;
    setMfaStep(2); // "sending" state
    setMfaSendDots("");
    // Simulate sending delay
    setTimeout(() => {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setMfaCode(code);
      setMfaCountdown(300);
      setMfaStep(3); // code entry
      setMfaInput("");
      setMfaError(false);
    }, 2200);
  };
  const verifyMfa = () => {
    if (mfaInput === mfaCode) { setAuthenticated(true); }
    else { setMfaError(true); setMfaInput(""); }
  };
  const resendCode = () => {
    setMfaStep(2);
    setTimeout(() => {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setMfaCode(code);
      setMfaCountdown(300);
      setMfaStep(3);
      setMfaInput("");
      setMfaError(false);
    }, 1800);
  };

  // Countdown timer for MFA code expiry (5 min)
  React.useEffect(() => {
    if (mfaStep !== 3 || authenticated) return;
    if (mfaCountdown <= 0) {
      setMfaStep(1);
      setMfaCode("");
      setMfaInput("");
      setMfaError(false);
      return;
    }
    const t = setTimeout(() => setMfaCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [mfaStep, mfaCountdown, authenticated]);

  // Sending animation dots
  React.useEffect(() => {
    if (mfaStep !== 2) return;
    const t = setInterval(() => setMfaSendDots(d => d.length >= 3 ? "" : d + "."), 500);
    return () => clearInterval(t);
  }, [mfaStep]);

  const [view, setView] = useState("dashboard");
  const [deals, setDeals] = useState([]);
  const [leads, setLeads] = useState([]);
  const [editingDeal, setEditingDeal] = useState(null);
  const [addingLead, setAddingLead] = useState(false);
  const [emailModal, setEmailModal] = useState(null); // {status, dealId}

  // Tasks / Follow-ups
  const [tasks, setTasks] = useState([]);
  const [addingTask, setAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", dueDate: "", dealId: "", leadId: "", priority: "normal", notes: "" });
  const addTask = () => {
    if (!newTask.title.trim()) return;
    const t = { ...newTask, id: Date.now(), createdAt: new Date().toLocaleDateString(), done: false };
    setTasks(p => [t, ...p]);
    saveTaskToDB(t);
    setNewTask({ title: "", dueDate: "", dealId: "", leadId: "", priority: "normal", notes: "" });
    setAddingTask(false);
  };
  const toggleTask = (id) => setTasks(p => p.map(t => {
    if (t.id === id) { const updated = { ...t, done: !t.done, completedAt: !t.done ? new Date().toLocaleDateString() : null }; saveTaskToDB(updated); return updated; }
    return t;
  }));
  const deleteTask = (id) => { setTasks(p => p.filter(t => t.id !== id)); sb.del("tasks", { id }); };

  // Activity log (per deal)
  const [activityLog, setActivityLog] = useState([]); // {id, dealId, text, timestamp}
  const [newNote, setNewNote] = useState("");
  const addActivity = (dealId, text) => {
    if (!text.trim()) return;
    const entry = { id: Date.now(), dealId, text, timestamp: new Date().toLocaleString() };
    setActivityLog(p => [entry, ...p]);
    sb.upsert("activity_log", { id: entry.id, deal_id: dealId, text, timestamp: entry.timestamp });
  };

  // Document checklist per deal
  const DOC_ITEMS = ["Counseling Certificate","Insurance Dec Page","Property Tax Statement","Government Photo ID","HOA Docs","Title Report","Appraisal","Intent to Proceed","Signed Application","Trust/POA Docs"];
  const [docChecks, setDocChecks] = useState({}); // { dealId: { docName: true/false } }
  const toggleDoc = (dealId, docName) => {
    setDocChecks(p => {
      const newVal = !(p[dealId] || {})[docName];
      sb.upsert("doc_checks", { deal_id: dealId, doc_name: docName, checked: newVal });
      return { ...p, [dealId]: { ...(p[dealId] || {}), [docName]: newVal } };
    });
  };

  // Referral partners
  const [referrals, setReferrals] = useState([]);
  const [addingReferral, setAddingReferral] = useState(false);
  const [newRef, setNewRef] = useState({ name: "", type: "Financial Advisor", phone: "", email: "", notes: "" });
  const REF_TYPES = ["Financial Advisor","Realtor","Attorney","CPA/Tax","Past Client","Insurance Agent","Other"];

  // Expenses
  const [expenses, setExpenses] = useState([]);
  const [addingExpense, setAddingExpense] = useState(false);
  const [newExp, setNewExp] = useState({ description: "", amount: "", category: "Marketing", date: "", notes: "" });
  const EXP_CATEGORIES = ["Marketing","Licensing","E&O Insurance","CE Courses","Office/Software","Mileage","Travel","Lead Gen","Other"];

  // Licensing checklists
  const [licChecks, setLicChecks] = useState({});
  const toggleLic = (section, item) => {
    const key = `${section}::${item}`;
    setLicChecks(p => {
      const newVal = !p[key];
      sb.upsert("lic_checks", { check_key: key, checked: newVal });
      return { ...p, [key]: newVal };
    });
  };
  const licCount = (section, items) => items.filter(i => licChecks[`${section}::${i}`]).length;

  // ═══════════════════════════════════════════════════
  // SUPABASE DATA SYNC
  // ═══════════════════════════════════════════════════
  const [dbStatus, setDbStatus] = useState("loading"); // loading | connected | offline
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const dbInitRef = React.useRef(false);

  // ── Load all data on mount ──
  useEffect(() => {
    if (dbInitRef.current) return;
    dbInitRef.current = true;
    (async () => {
      try {
        const [dbLeads, dbDeals, dbTasks, dbActivity, dbReferrals, dbExpenses, dbCampaigns, dbDocChecks, dbLicChecks] = await Promise.all([
          sb.get("customers", "order=id.desc"),
          sb.get("deals", "order=id.desc"),
          sb.get("tasks", "order=id.desc"),
          sb.get("activity_log", "order=id.desc"),
          sb.get("referrals", "order=id.desc"),
          sb.get("expenses", "order=id.desc"),
          sb.get("campaigns", "order=id.desc"),
          sb.get("doc_checks"),
          sb.get("lic_checks"),
        ]);
        if (dbLeads.length || dbDeals.length || dbTasks.length) setDbStatus("connected"); else setDbStatus("connected");

        // Map DB rows to app state format
        if (dbLeads.length) setLeads(dbLeads.map(r => ({
          id: r.id, custId: r.cust_id, leadId: r.lead_id || r.cust_id, name: r.name, state: r.state || "AZ",
          address: r.address || "", dob: r.dob || "", phone: r.phone || "", email: r.email || "",
          source: r.source || "", notes: r.notes || "", origMortgageDate: r.orig_mortgage_date || "",
          maxClaim: r.max_claim || "", mipAmount: r.mip_amount || 0, converted: r.converted || false,
          convertedAt: r.converted_at || "", createdAt: r.created_at || "", mailings: [],
          interestRate: r.interest_rate || "",
        })));
        // Load mailings and attach to leads
        if (dbLeads.length) {
          const dbMailings = await sb.get("mailings", "order=id.desc");
          if (dbMailings.length) {
            setLeads(prev => prev.map(l => ({
              ...l,
              mailings: dbMailings.filter(m => m.customer_id === l.id).map(m => ({
                id: m.id, campaignId: m.campaign_id, stampType: m.stamp_type || "",
                envelopeType: m.envelope_type || "", dateSent: m.date_sent || "",
                notes: m.notes || "", cost: m.cost || "",
              }))
            })));
          }
        }
        if (dbDeals.length) setDeals(dbDeals.map(r => ({
          id: r.id, leadId: r.lead_id || "", name: r.name, state: r.state || "", dob: r.dob || "",
          email: r.email || "", propertyValue: r.property_value || 0, currentBalance: r.current_balance || 0,
          currentPL: r.current_pl || 0, newPL: r.new_pl || 0, newMCA: r.new_mca || 0,
          totalRefiCosts: r.total_refi_costs || 0, netAvailable: r.net_available || 0,
          brokerIncome: r.broker_income || 0, lender: r.lender || "", productLabel: r.product_label || "",
          margin: r.margin || 0, status: r.status || "Pitched", createdAt: r.created_at || "",
          passes3x1: r.passes_3x1, passes5x1: r.passes_5x1, passesProceeds: r.passes_proceeds,
          passesSeasoning: r.passes_seasoning, ratio3x1: r.ratio_3x1 || "0", rateType: r.rate_type || "",
        })));
        if (dbTasks.length) setTasks(dbTasks.map(r => ({
          id: r.id, title: r.title, dueDate: r.due_date || "", dealId: r.deal_id || "",
          leadId: r.lead_id || "", priority: r.priority || "normal", notes: r.notes || "",
          done: r.done || false, completedAt: r.completed_at || "", createdAt: r.created_at || "",
        })));
        if (dbActivity.length) setActivityLog(dbActivity.map(r => ({
          id: r.id, dealId: r.deal_id, text: r.text, timestamp: r.timestamp || "",
        })));
        if (dbReferrals.length) setReferrals(dbReferrals.map(r => ({
          id: r.id, name: r.name, type: r.type || "Financial Advisor", phone: r.phone || "",
          email: r.email || "", notes: r.notes || "", createdAt: r.created_at || "",
        })));
        if (dbExpenses.length) setExpenses(dbExpenses.map(r => ({
          id: r.id, description: r.description, amount: r.amount || "", category: r.category || "Marketing",
          date: r.date || "", notes: r.notes || "", createdAt: r.created_at || "",
        })));
        if (dbCampaigns.length) setCampaigns(dbCampaigns.map(r => ({
          id: r.id, name: r.name, date: r.date || "", notes: r.notes || "",
          costPerPiece: r.cost_per_piece || "", hoursEstimate: r.hours_estimate || "",
          leadIds: r.lead_ids || [], createdAt: r.created_at || "",
        })));
        if (dbDocChecks.length) {
          const dc = {};
          dbDocChecks.forEach(r => { if (!dc[r.deal_id]) dc[r.deal_id] = {}; dc[r.deal_id][r.doc_name] = r.checked; });
          setDocChecks(dc);
        }
        if (dbLicChecks.length) {
          const lc = {};
          dbLicChecks.forEach(r => { lc[r.check_key] = r.checked; });
          setLicChecks(lc);
        }
      } catch(e) { console.warn("Supabase load failed, running in demo mode:", e); setDbStatus("offline"); }
    })();
  }, []);

  // ── Auto-save helpers ──
  const saveLeadToDB = useCallback((lead) => {
    sb.upsert("customers", {
      id: lead.id, cust_id: lead.custId, lead_id: lead.leadId, name: lead.name, state: lead.state,
      address: lead.address || "", dob: lead.dob || "", phone: lead.phone || "", email: lead.email || "",
      source: lead.source || "", notes: lead.notes || "", orig_mortgage_date: lead.origMortgageDate || "",
      max_claim: lead.maxClaim || "", mip_amount: lead.mipAmount || 0, converted: lead.converted || false,
      converted_at: lead.convertedAt || "", created_at: lead.createdAt || "",
      interest_rate: lead.interestRate || "",
    });
  }, []);

  const saveDealToDB = useCallback((deal) => {
    sb.upsert("deals", {
      id: deal.id, lead_id: deal.leadId, name: deal.name, state: deal.state, dob: deal.dob || "",
      email: deal.email || "", property_value: deal.propertyValue || 0, current_balance: deal.currentBalance || 0,
      current_pl: deal.currentPL || 0, new_pl: deal.newPL || 0, new_mca: deal.newMCA || 0,
      total_refi_costs: deal.totalRefiCosts || 0, net_available: deal.netAvailable || 0,
      broker_income: deal.brokerIncome || 0, lender: deal.lender || "", product_label: deal.productLabel || "",
      margin: deal.margin || 0, status: deal.status || "Pitched", created_at: deal.createdAt || "",
      passes_3x1: deal.passes3x1, passes_5x1: deal.passes5x1, passes_proceeds: deal.passesProceeds,
      passes_seasoning: deal.passesSeasoning, ratio_3x1: deal.ratio3x1 || "0", rate_type: deal.rateType || "",
    });
  }, []);

  const saveTaskToDB = useCallback((task) => {
    sb.upsert("tasks", {
      id: task.id, title: task.title, due_date: task.dueDate || "", deal_id: task.dealId || "",
      lead_id: task.leadId || "", priority: task.priority || "normal", notes: task.notes || "",
      done: task.done || false, completed_at: task.completedAt || "", created_at: task.createdAt || "",
    });
  }, []);

  // ── CSV Bulk Import ──
  const handleCsvImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvImporting(true); setCsvResult(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        // Strip BOM (Excel adds hidden characters at start of CSV)
        let text = ev.target.result;
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        // Handle CSV fields that may contain commas inside quotes
        const parseCSVLine = (line) => {
          const result = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') { inQuotes = !inQuotes; }
            else if (line[i] === ',' && !inQuotes) { result.push(current.trim()); current = ""; }
            else { current += line[i]; }
          }
          result.push(current.trim());
          return result;
        };
        const lines = text.split("\n").filter(l => l.trim());
        if (lines.length < 2) { setCsvResult({ ok: false, msg: "CSV needs a header row + data" }); setCsvImporting(false); return; }

        // Normalize headers: lowercase, strip special chars, spaces → underscores
        const rawHeaders = parseCSVLine(lines[0]);
        const headers = rawHeaders.map(h => h.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/ +/g, "_"));

        const imported = [];
        for (let i = 1; i < lines.length; i++) {
          const vals = parseCSVLine(lines[i]);
          if (vals.length < 2 || vals.every(v => !v.trim())) continue; // skip empty rows
          const row = {};
          headers.forEach((h, j) => { row[h] = (vals[j] || "").replace(/^"|"$/g, "").trim(); });

          // ── Map columns flexibly ──
          // Try header-based matching first, then positional fallback
          // Your columns: Name, Street Address, City, State, Zip, Lender, Origination Date
          const colByPos = headers.length >= 7 ? {
            name: vals[0] || "", street: vals[1] || "", city: vals[2] || "",
            state: vals[3] || "", zip: vals[4] || "", lender: vals[5] || "", origDate: vals[6] || "",
          } : null;

          // Name
          let name = row.name || row.borrower_name || row.full_name || row.customer_name || row.borrower || row.client_name || row.client || row.first_name || "";
          if (!name && colByPos) name = colByPos.name;
          // Still try first non-empty value as name
          if (!name) name = vals.find(v => v && v.trim()) || "";
          name = name.replace(/^"|"$/g, "").trim();
          if (!name) continue;

          // Address — combine street + city + state + zip if separate columns
          const street = row.street_address || row.street || row.address || row.property_address || row.address_1 || (colByPos ? colByPos.street : "") || "";
          const city = row.city || row.town || (colByPos ? colByPos.city : "") || "";
          const st = row.state || row.st || (colByPos ? colByPos.state : "") || "";
          const zip = row.zip || row.zip_code || row.zipcode || row.postal || row.postal_code || (colByPos ? colByPos.zip : "") || "";
          let fullAddress = street;
          if (city) fullAddress += (fullAddress ? ", " : "") + city;
          if (st) fullAddress += (fullAddress ? ", " : "") + st;
          if (zip) fullAddress += (fullAddress ? " " : "") + zip;

          // State
          const state = (st || "AZ").toUpperCase().trim().substring(0, 2);

          // Lender
          const lender = row.lender || row.current_lender || row.servicer || row.loan_servicer || (colByPos ? colByPos.lender : "") || "";

          // Origination date
          const origDate = row.origination_date || row.orig_date || row.origination || row.orig_mortgage_date || row.original_date || row.closing_date || row.loan_date || row.date || (colByPos ? colByPos.origDate : "") || "";

          // Other fields
          const phone = row.phone || row.telephone || row.mobile || row.phone_number || "";
          const email = row.email || row.email_address || "";
          const dob = row.dob || row.date_of_birth || row.birthday || row.birth_date || "";
          const maxClaim = row.max_claim || row.max_claim_amount || row.mca || row.claim_amount || "";
          const custIdRaw = row.customer_id || row.cust_id || row.id || row.account || row.loan_number || "";

          const id = Date.now() + i;
          const llCode = getLLCode(maxClaim, origDate);
          const autoId = llCode ? `RBR-${llCode}-${1000 + leads.length + i}` : `RBR-${1000 + leads.length + i}`;
          const cid = custIdRaw || autoId;
          const lead = {
            id, custId: cid, leadId: custIdRaw || cid, name,
            state: state || "AZ",
            address: fullAddress,
            dob, phone, email,
            source: "CSV Import" + (lender ? ` · ${lender}` : ""),
            notes: lender ? `Current lender: ${lender}` : "",
            origMortgageDate: origDate,
            maxClaim,
            mipAmount: 0, converted: false, convertedAt: "",
            createdAt: new Date().toLocaleDateString(), mailings: [],
          };
          if (pn(lead.maxClaim) > 0) lead.mipAmount = calcMIP(lead.maxClaim);
          imported.push(lead);
        }
        // Save to state
        setLeads(prev => [...imported, ...prev]);
        // Save to Supabase in batches
        const batchSize = 50;
        for (let b = 0; b < imported.length; b += batchSize) {
          const batch = imported.slice(b, b + batchSize).map(l => ({
            id: l.id, cust_id: l.custId, lead_id: l.leadId, name: l.name, state: l.state,
            address: l.address, dob: l.dob, phone: l.phone, email: l.email, source: l.source,
            notes: l.notes, orig_mortgage_date: l.origMortgageDate, max_claim: l.maxClaim,
            mip_amount: l.mipAmount, created_at: l.createdAt,
          }));
          await sb.upsert("customers", batch);
        }
        setCsvResult({ ok: true, msg: `Imported ${imported.length} leads from ${lines.length - 1} rows. Headers found: ${headers.join(", ")}` });
      } catch(err) { setCsvResult({ ok: false, msg: `Error: ${err.message}` }); }
      setCsvImporting(false);
    };
    reader.readAsText(file);
  };

  const LIC_SOLO_SHOP = {
    title: "Solo LO Shop Setup",
    desc: "Everything needed to operate as an independent mortgage loan originator",
    sections: [
      { name: "NMLS & Federal", items: [
        "Create NMLS account & get Unique Identifier",
        "Complete 20-hr SAFE Act Pre-Licensing Education (3hr federal law, 3hr ethics, 2hr non-traditional, 12hr elective)",
        "Pass SAFE MLO National Test with UST (75% min, 120 questions, $110)",
        "Submit FBI fingerprint criminal background check via NMLS ($36.25–$46.25)",
        "Authorize NMLS credit report pull",
        "No felony convictions (fraud, money laundering, dishonesty)",
        "Demonstrate financial responsibility (clean credit)",
      ]},
      { name: "Business Formation", items: [
        "Choose business structure (Sole Prop / LLC / Corp)",
        "Register with Secretary of State (if LLC/Corp)",
        "Obtain EIN from IRS",
        "Open business bank account",
        "Register as foreign entity in each state you'll originate (if applicable)",
      ]},
      { name: "Company NMLS License", items: [
        "File Company (MU1) form on NMLS",
        "Pay company application fee",
        "File Individual (MU4) form on NMLS",
        "Obtain surety bond or pay into recovery fund (state-specific)",
        "Meet net worth requirements (state-specific)",
        "Designate Qualifying Individual / Principal LO",
      ]},
      { name: "Insurance & Bonding", items: [
        "Obtain E&O (Errors & Omissions) insurance",
        "Obtain surety bond (amount varies by state)",
        "General liability insurance (recommended)",
        "Cyber liability insurance (recommended)",
      ]},
      { name: "Compliance & Operations", items: [
        "Set up compliant email and document storage",
        "Create privacy policy & information security plan",
        "Establish written supervisory procedures (WSP)",
        "Register with state AG / consumer protection (if required)",
        "Set up HMDA / fair lending compliance procedures",
        "Obtain compliant advertising disclosures (NMLS # on all materials)",
        "Set up BSA/AML compliance program",
      ]},
      { name: "Annual Renewal & CE", items: [
        "Complete 8-hr NMLS Continuing Education annually (3hr federal, 2hr ethics, 2hr non-traditional, 1hr elective)",
        "Renew NMLS license before Dec 31 each year",
        "Pay annual renewal fees (state-specific)",
        "Update financial statements / bond if required",
        "File annual reports / call reports (if required by state)",
      ]},
    ],
  };

  const LIC_STATES = [
    {
      state: "AZ", name: "Arizona", regulator: "AZ Dept. of Insurance & Financial Institutions (DIFI)",
      sections: [
        { name: "Pre-License Education", items: [
          "Complete 20-hr federal SAFE PE course",
          "Complete 4-hr Arizona-specific PE (AZ laws & regulations)",
          "Total: 24 hours pre-licensing education",
        ]},
        { name: "Testing", items: [
          "Pass SAFE MLO National Test with Uniform State Content ($110)",
          "75% minimum passing score",
          "120 questions, 190 minutes",
        ]},
        { name: "Background & Credit", items: [
          "Submit FBI fingerprint CBC via NMLS ($36.25 Live Scan or $46.25 card)",
          "Authorize NMLS credit report",
          "No disqualifying felony convictions",
        ]},
        { name: "Bonding & Fees", items: [
          "Pay $100 into AZ Recovery Fund OR employer provides $200K+ surety bond",
          "MLO license application fee via NMLS",
          "NMLS processing fee ($30)",
        ]},
        { name: "Sponsorship", items: [
          "Must be sponsored by a licensed AZ mortgage broker or banker",
          "Sponsor files sponsorship request in NMLS",
          "If sole proprietor: obtain AZ Mortgage Broker license (MU1 + MU4)",
        ]},
        { name: "Annual Renewal", items: [
          "8-hr NMLS CE annually (includes AZ-specific content)",
          "Renew before Dec 31",
          "Renewal fee via NMLS",
        ]},
      ],
    },
    {
      state: "CA", name: "California", regulator: "CA Dept. of Real Estate (DRE) or DFPI",
      sections: [
        { name: "License Path (Choose One)", items: [
          "OPTION A: DRE — Get CA Real Estate license + MLO endorsement",
          "OPTION B: DFPI — Apply for DFPI MLO license directly (standalone)",
        ]},
        { name: "Pre-License Education", items: [
          "Complete 20-hr federal SAFE PE course",
          "Complete 2-hr California-specific PE (CA laws)",
          "Total: 22 hours pre-licensing education",
        ]},
        { name: "Testing", items: [
          "Pass SAFE MLO National Test with Uniform State Content ($110)",
          "75% minimum passing score",
        ]},
        { name: "Background & Credit", items: [
          "Submit FBI fingerprint CBC via NMLS",
          "Authorize NMLS credit report",
          "CA DOJ Live Scan fingerprinting (additional state check)",
        ]},
        { name: "DRE Path Specifics", items: [
          "Hold active CA Real Estate Salesperson or Broker license",
          "File Individual MU4 form on NMLS",
          "Company must file MU1 if sole proprietor",
          "Must be sponsored by employing broker",
          "No separate surety bond for DRE-endorsed MLOs",
          "$50 penalty/day if originating without endorsement (up to $10K)",
        ]},
        { name: "DFPI Path Specifics", items: [
          "File MU4 on NMLS with DFPI as regulator",
          "Surety bond required ($25K min for broker, varies)",
          "Net worth requirements apply to company license",
          "Company license (CFL or CRMLA) required",
        ]},
        { name: "Annual Renewal", items: [
          "8-hr NMLS CE annually",
          "CA DRE license renewal every 4 years (45-hr CE for salesperson)",
          "Renew MLO endorsement annually via NMLS before Dec 31",
        ]},
      ],
    },
    {
      state: "FL", name: "Florida", regulator: "FL Office of Financial Regulation (OFR)",
      sections: [
        { name: "Pre-License Education", items: [
          "Complete 20-hr federal SAFE PE course",
          "Complete 2-hr Florida-specific PE",
          "Total: 22 hours pre-licensing education",
        ]},
        { name: "Testing", items: [
          "Pass SAFE MLO National Test with Uniform State Content ($110)",
          "75% minimum passing score",
        ]},
        { name: "Background & Credit", items: [
          "Submit FBI fingerprint CBC via NMLS ($36.25)",
          "FL state criminal background check ($24)",
          "Authorize NMLS credit report ($15)",
        ]},
        { name: "MLO License Application", items: [
          "File Individual MU4 form on NMLS",
          "MLO application fee: $195",
          "NMLS processing fee: $30",
          "Must be employed/sponsored by licensed FL mortgage company",
        ]},
        { name: "Company License (if sole proprietor)", items: [
          "Choose license type: Mortgage Broker, Lender, or Lender-Servicer",
          "File Company MU1 form on NMLS",
          "Company application fee: $525 (broker) or $800 (lender)",
          "Registered Agent in FL ($125)",
          "Foreign Entity registration if out-of-state ($70)",
          "Broker: No surety bond or net worth required",
          "Lender: $63K audited net worth + $10K surety bond",
          "Lender-Servicer: $250K audited net worth",
          "Designate Qualifying Individual (licensed FL MLO, 1yr experience for broker)",
        ]},
        { name: "Annual Renewal", items: [
          "8-hr NMLS CE annually",
          "Renew before Dec 31",
          "Submit annual reports to OFR",
          "Maintain financial statements / net worth if lender",
        ]},
      ],
    },
    {
      state: "WA", name: "Washington", regulator: "WA Dept. of Financial Institutions (DFI)",
      sections: [
        { name: "Pre-License Education", items: [
          "Complete 20-hr federal SAFE PE course",
          "Complete 2-hr Washington-specific PE (WA laws)",
          "Total: 22 hours pre-licensing education",
        ]},
        { name: "Testing", items: [
          "Pass SAFE MLO National Test with Uniform State Content ($110)",
          "75% minimum passing score",
        ]},
        { name: "Background & Credit", items: [
          "Submit FBI fingerprint CBC via NMLS",
          "Authorize NMLS credit report",
          "No disqualifying felony convictions",
        ]},
        { name: "MLO License Application", items: [
          "File Individual MU4 form on NMLS",
          "Must be sponsored by licensed WA mortgage company",
          "Application fee via NMLS",
        ]},
        { name: "Company License (if sole proprietor)", items: [
          "Apply for WA Consumer Loan Company license or Mortgage Broker license",
          "File Company MU1 form on NMLS",
          "Surety bond: $20K–$100K+ (based on loan volume)",
          "Net worth requirement: $50K (broker) or higher (lender)",
          "Physical in-state office not required",
          "Designate Designated Person in Charge (DPC)",
        ]},
        { name: "Annual Renewal & CE", items: [
          "9-hr NMLS CE annually (1 extra hour vs federal minimum)",
          "Includes: 3hr federal, 2hr ethics, 2hr non-traditional, 1hr elective, 1hr WA-specific",
          "CE deadline: December 15 (earlier than most states)",
          "Cannot take same CE course 2 years in a row",
          "Renew before Dec 31",
        ]},
      ],
    },
  ];

  const [licTab, setLicTab] = useState("solo"); // solo | AZ | CA | FL | WA

  // Calc state
  const [c, sc] = useState({
    name: "", state: "AZ", dob: "", propVal: "", cmtIndex: "4.260",
    curBal: "", curPL: "", origMCA: "", origIMIP: "", origClose: "",
    origFee: "", otherCosts: "", email: "", leadId: "", phone: "", address: "", interestRate: "",
    lenderKey: "FOA", productKey: "HECM_ARM", tierIdx: 2,
  });
  const u = (k, v) => sc(p => ({ ...p, [k]: v }));

  // Pricing history — tracks every time pricing is run on a lead
  const [pricingHistory, setPricingHistory] = useState([]);

  // Run Pricing state
  const [pricingResults, setPricingResults] = useState(null);
  const [pricingSortBy, setPricingSortBy] = useState("brokerComp");
  const [selectedResult, setSelectedResult] = useState(null);
  const [pipelineFilter, setPipelineFilter] = useState("active"); // active | funded | fallout | all
  const [showConfetti, setShowConfetti] = useState(0); // 0=none, 1=small, 2=big
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [deleteAllStep, setDeleteAllStep] = useState(0); // 0=hidden, 1=first pw, 2=second pw
  const [deleteAllPw, setDeleteAllPw] = useState("");

  const runPricing = () => {
    const age = calcAge(c.dob);
    if (!age) { alert("Enter borrower date of birth"); return; }
    const pv = pn(c.propVal);
    if (!pv) { alert("Enter property value"); return; }
    const cmtVal = parseFloat(c.cmtIndex) || 4.260;
    const cb = pn(c.curBal), cp = pn(c.curPL), om = pn(c.origMCA);
    const oIMIP = pn(c.origIMIP), oFee = pn(c.origFee), oCosts = pn(c.otherCosts);
    const results = [];

    Object.entries(LENDERS).forEach(([lenderKey, lender]) => {
      Object.entries(lender.products).forEach(([productKey, product]) => {
        const isProp = product.rateType === "fixed_prop" || product.rateType === "arm_prop";
        const isFixed = product.rateType === "fixed" || product.rateType === "fixed_prop";
        const minAge = product.minAge || 62;
        if (age < minAge) return;
        if (product.minLoan) {
          const testMCA = Math.min(pv, product.maxLoan || HECM_LIMIT);
          if (testMCA < product.minLoan) return;
        }
        // Check state availability for proprietary products
        const st = c.state;
        if (product.states55 && !product.states55.includes(st) && (!product.states60 || !product.states60.includes(st)) && (!product.states62 || !product.states62.includes(st))) {
          // not in any state list
          if (product.states55 || product.states60 || product.states62) return;
        }
        if (product.statesFixed && !product.statesFixed.includes(st)) return;
        if (product.statesAdj && !product.statesAdj.includes(st)) return;

        product.tiers.forEach((tier, tierIdx) => {
          let expRate;
          if (isFixed) { expRate = tier.noteRate; }
          else { expRate = cmtVal + tier.margin; }

          const maxLA = product.maxLoan || HECM_LIMIT;
          const nMCA = Math.min(pv, maxLA);
          const plf = getPLF(age, expRate, isProp);
          if (!plf) return;
          const nPL = nMCA * plf;
          const mcaInc = Math.max(0, nMCA - om);
          const nIMIP = product.hasMIP ? Math.max(0, mcaInc * product.mipUpfront) : 0;
          const totalCosts = oFee + oCosts + nIMIP;
          const plInc = Math.max(0, nPL - cp);
          const nFunds = nPL - cb - totalCosts;
          const ratio = totalCosts > 0 ? plInc / totalCosts : 0;

          // Calculate broker comp = SRP on UPB + origination fee
          // New UPB at closing = current balance + new IMIP + closing costs funded
          const newUPB = cb + nIMIP + oFee + oCosts;
          // SRP = (premium - 100) as % × UPB
          let srpPct = 0;
          let premForCalc = product.premium || tier.premium || 100;
          if (tier.prem25_80) premForCalc = tier.prem25_80; // best-case utilization
          if (product.premiumGrid) {
            const row = product.premiumGrid.rows.find(r => r.margin === tier.margin);
            if (row) premForCalc = row.prems[4]; // mid-range PLU 40-50%
          }
          srpPct = (premForCalc - 100) / 100;
          const srpOnUPB = Math.max(0, srpPct * newUPB);
          // Origination fee to broker
          let brokerOrig = oFee; // broker keeps the origination fee
          // Some products require orig paid to lender instead
          if (tier.origPctToFOA) brokerOrig = Math.max(0, oFee - (nPL * (tier.origPctToFOA / 100)));
          if (tier.origPctToMoO) brokerOrig = Math.max(0, oFee - (nPL * (tier.origPctToMoO / 100)));
          const bComp = srpOnUPB + Math.max(0, brokerOrig);

          // Get premium for display
          let premium = premForCalc;

          const initRate = isFixed ? tier.noteRate : (cmtVal + tier.margin);
          const marginDisplay = isFixed ? `${tier.noteRate}% fixed` : `${tier.margin}%`;

          results.push({
            lenderKey, lender: lender.short, lenderName: lender.name, lenderColor: lender.color,
            productKey, product: product.label, tierIdx,
            tierLabel: tier.label || marginDisplay,
            rateType: product.rateType, isFixed, isProp,
            margin: tier.margin, noteRate: tier.noteRate,
            initRate: Math.round(initRate * 1000) / 1000,
            expRate: expRate,
            premium, newPL: nPL, newMCA: nMCA, newIMIP: nIMIP, newUPB,
            totalCosts, plIncrease: plInc, netFunds: nFunds,
            brokerComp: bComp, srpOnUPB, brokerOrig: Math.max(0, brokerOrig), ratio3x1: ratio,
            passes3x1: ratio >= 3, passesProceeds: nFunds >= nPL * 0.05,
            lesaRate: tier.lesaRate || tier.lesaMargin ? (tier.lesaRate || (cmtVal + (tier.lesaMargin || 0))) : null,
          });
        });
      });
    });

    // Sort by selected criteria
    results.sort((a, b) => b.brokerComp - a.brokerComp);
    setPricingResults(results);
    setSelectedResult(null);

    // Log to pricing history
    if (results.length > 0) {
      const best = results[0];
      const entry = {
        id: Date.now(), custId: c.leadId || "", name: c.name, state: c.state, address: c.address || "",
        phone: c.phone || "", email: c.email || "", dob: c.dob || "",
        propVal: pv, curBal: cb, resultsCount: results.length,
        bestProduct: `${best.lender} ${best.product}`, bestComp: best.brokerComp,
        bestNetFunds: best.netFunds, bestRate: best.initRate,
        timestamp: new Date().toLocaleString(), date: new Date().toLocaleDateString(),
      };
      setPricingHistory(prev => [entry, ...prev]);
    }
  };

  const selectPricingResult = (r) => {
    sc(p => ({ ...p, lenderKey: r.lenderKey, productKey: r.productKey, tierIdx: r.tierIdx }));
    setSelectedResult(r);
    setPricingResults(null);
  };

  // Send a pricing result directly to pipeline
  const sendResultToPipeline = (r) => {
    if (!c.name.trim()) { alert("Enter borrower name"); return; }
    const dealLeadId = c.leadId.trim() || `RBR-${Date.now().toString().slice(-4)}`;
    const newDeal = {
      id: Date.now(), leadId: dealLeadId, name: c.name.trim(), state: c.state, dob: c.dob, email: c.email, phone: c.phone || "", address: c.address || "",
      propertyValue: pn(c.propVal), currentBalance: pn(c.curBal), currentPL: pn(c.curPL), newPL: r.newPL, newMCA: r.newMCA,
      totalRefiCosts: r.totalCosts, netAvailable: Math.max(0, r.netFunds), brokerIncome: r.brokerComp,
      lender: r.lenderKey, productLabel: r.product, margin: r.isFixed ? r.noteRate : r.margin,
      status: "Pitched", createdAt: new Date().toLocaleDateString(),
      passes3x1: r.passes3x1, passes5x1: r.ratio3x1 >= 5, passesProceeds: r.passesProceeds, passesSeasoning: seasoningPass,
      ratio3x1: r.ratio3x1.toFixed(1), rateType: r.rateType, initRate: r.initRate,
      // Pipeline workflow fields
      pipelineChecks: {}, followUpDate: "", appraisalInspDate: "", appraisalReportDate: "",
      appraisedValue: "", stips: [], notaryName: "", notaryContact: "", closingDateTime: "",
      hudApproved: false, counselingDate: "", counselingTime: "", agentInfo: "",
      sentToLenderAt: null,
    };
    setDeals(prev => [newDeal, ...prev]);
    saveDealToDB(newDeal);
    setPricingResults(null);
    setView("pipeline");
  };

  const lender = LENDERS[c.lenderKey];
  const product = lender.products[c.productKey];
  const tier = product?.tiers[c.tierIdx] || product?.tiers[0];
  const isFixed = product?.rateType === "fixed" || product?.rateType === "fixed_prop";
  const isProp = product?.rateType === "fixed_prop" || product?.rateType === "arm_prop";

  const age = calcAge(c.dob);
  const propVal = pn(c.propVal), cmtVal = parseFloat(c.cmtIndex) || 4.260;
  const curBal = pn(c.curBal), curPL = pn(c.curPL), origMCA = pn(c.origMCA);
  const origIMIP = pn(c.origIMIP), origFee = pn(c.origFee), otherCosts = pn(c.otherCosts);

  let expectedRate;
  if (isFixed) { expectedRate = tier.noteRate; } else { expectedRate = cmtVal + tier.margin; }

  const maxLoanAmt = product?.maxLoan || HECM_LIMIT;
  const newMCA = Math.min(propVal, maxLoanAmt);
  const plf = age !== null ? getPLF(age, expectedRate, isProp) : null;
  const newPL = plf ? newMCA * plf : 0;
  const mcaIncrease = Math.max(0, newMCA - origMCA);
  const newIMIP = product?.hasMIP ? Math.max(0, mcaIncrease * product.mipUpfront) : 0;
  const totalRefiCosts = origFee + otherCosts + newIMIP;
  const plIncrease = Math.max(0, newPL - curPL);

  let monthsSeasoned = null;
  if (c.origClose) { const oc = new Date(c.origClose), now = new Date(); monthsSeasoned = (now.getFullYear() - oc.getFullYear()) * 12 + (now.getMonth() - oc.getMonth()); }
  const seasoningPass = monthsSeasoned !== null && monthsSeasoned >= 18;
  const ratio3 = totalRefiCosts > 0 ? plIncrease / totalRefiCosts : 0, pass3 = ratio3 >= 3;
  const ratio5 = totalRefiCosts > 0 ? plIncrease / totalRefiCosts : 0, pass5 = ratio5 >= 5;
  const netFunds = newPL - curBal - totalRefiCosts, thresh5pct = newPL * 0.05, passProceed = netFunds >= thresh5pct;
  const netAvailable = Math.max(0, netFunds);

  // Broker comp = SRP on UPB + origination fee
  const newUPB = curBal + newIMIP + origFee + otherCosts;
  let mainPremium = product?.premium || 100;
  if (tier?.prem25_80) mainPremium = tier.prem25_80;
  if (product?.premiumGrid) {
    const row = product.premiumGrid.rows.find(r => r.margin === tier?.margin);
    if (row) mainPremium = row.prems[4];
  }
  const srpPct = (mainPremium - 100) / 100;
  const srpOnUPB = Math.max(0, srpPct * newUPB);
  let brokerOrig = origFee;
  if (tier?.origPctToFOA) brokerOrig = Math.max(0, origFee - (newPL * (tier.origPctToFOA / 100)));
  if (tier?.origPctToMoO) brokerOrig = Math.max(0, origFee - (newPL * (tier.origPctToMoO / 100)));
  const brokerComp$ = srpOnUPB + Math.max(0, brokerOrig);
  const lenderCredit$ = newPL * ((tier?.lenderCredit || 0) / 100);
  const allPass = seasoningPass && pass3 && passProceed;
  const ageOk = age !== null && age >= (product?.minAge || 62);

  const saveDeal = () => {
    if (!c.name.trim()) { alert("Enter borrower name"); return; }
    const dealLeadId = c.leadId.trim() || `RBR-${Date.now().toString().slice(-4)}`;
    const newDeal = {
      id: Date.now(), leadId: dealLeadId, name: c.name.trim(), state: c.state, dob: c.dob, email: c.email, phone: c.phone || "", address: c.address || "",
      propertyValue: propVal, currentBalance: curBal, currentPL: curPL, newPL, newMCA,
      totalRefiCosts, netAvailable, brokerIncome: brokerComp$,
      lender: c.lenderKey, productLabel: product?.label, margin: isFixed ? tier.noteRate : tier.margin,
      status: "Pitched", createdAt: new Date().toLocaleDateString(),
      passes3x1: pass3, passes5x1: pass5, passesProceeds: passProceed, passesSeasoning: seasoningPass,
      ratio3x1: ratio3.toFixed(1), rateType: product?.rateType, initRate: expectedRate,
      pipelineChecks: {}, followUpDate: "", appraisalInspDate: "", appraisalReportDate: "",
      appraisedValue: "", stips: [], notaryName: "", notaryContact: "", closingDateTime: "",
      hudApproved: false, counselingDate: "", counselingTime: "", agentInfo: "",
      sentToLenderAt: null,
    };
    setDeals(prev => [newDeal, ...prev]);
    saveDealToDB(newDeal);
    setView("pipeline");
  };

  // Leads
  const [nl, snl] = useState({ name: "", state: "AZ", phone: "", email: "", notes: "", source: "", leadId: "", custId: "", address: "", dob: "", origMortgageDate: "", maxClaim: "", interestRate: "" });
  const LL_CODES = { "1633950": "23LL", "1724737": "24LL", "1814625": "25LL", "1873687": "26LL", "1873688": "26LL" };
  const getLLCode = (maxClaim, origDate) => {
    const mc = Math.round(pn(maxClaim));
    const mcStr = String(mc);
    if (LL_CODES[mcStr]) return LL_CODES[mcStr];
    // Proprietary: over $1,815,000 but not a known HECM limit → PP + month + 2-digit year from orig date
    if (mc > 1815000) {
      if (origDate) {
        const d = new Date(origDate + (origDate.includes("T") ? "" : "T00:00"));
        if (!isNaN(d)) {
          const mo = d.getMonth() + 1; // 1-12
          const yr = String(d.getFullYear()).slice(-2);
          return `PP${mo}${yr}`;
        }
      }
      return "PP";
    }
    return null;
  };
  const nextCustId = (maxClaim, origDate) => {
    const existing = leads.map(l => parseInt((l.custId || "").replace(/\D/g, "")) || 0);
    const num = Math.max(1000, ...existing) + 1;
    const llCode = getLLCode(maxClaim || "", origDate || "");
    return llCode ? `RBR-${llCode}-${num}` : `RBR-${num}`;
  };
  const calcMIP = (maxClaim) => {
    const mc = parseFloat((maxClaim || "").toString().replace(/[^0-9.]/g, "")) || 0;
    if (mc <= 0) return 0;
    return (mc / 1.5) * 0.02;
  };
  const saveLead = () => {
    if (!nl.name.trim()) return;
    const cid = nl.custId.trim() || nextCustId(nl.maxClaim, nl.origMortgageDate);
    const lid = nl.leadId.trim() || cid;
    const mip = calcMIP(nl.maxClaim);
    const newLead = { ...nl, custId: cid, leadId: lid, mipAmount: mip, id: Date.now(), createdAt: new Date().toLocaleDateString(), mailings: [] };
    setLeads(p => [newLead, ...p]);
    saveLeadToDB(newLead);
    snl({ name: "", state: "AZ", phone: "", email: "", notes: "", source: "", leadId: "", custId: "", address: "", dob: "", origMortgageDate: "", maxClaim: "", interestRate: "" });
    setAddingLead(false);
  };

  // Edit Lead
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [editData, setEditData] = useState({});
  const startEditLead = (lead) => {
    setEditingLeadId(lead.id);
    setEditData({
      name: lead.name || "", state: lead.state || "AZ", phone: lead.phone || "", email: lead.email || "",
      address: lead.address || "", dob: lead.dob || "", notes: lead.notes || "", source: lead.source || "",
      origMortgageDate: lead.origMortgageDate || "", maxClaim: lead.maxClaim || "", interestRate: lead.interestRate || "",
      custId: lead.custId || "", leadId: lead.leadId || "",
    });
  };
  const saveEditLead = () => {
    const mip = calcMIP(editData.maxClaim);
    setLeads(p => p.map(l => {
      if (l.id === editingLeadId) {
        // Auto-update custId if max claim or orig date changed and the current ID was auto-generated (starts with RBR-)
        let newCustId = editData.custId || l.custId;
        const oldLL = getLLCode(l.maxClaim, l.origMortgageDate);
        const newLL = getLLCode(editData.maxClaim, editData.origMortgageDate);
        if (newLL !== oldLL && (newCustId || "").startsWith("RBR-")) {
          // Extract the numeric part from existing ID
          const numMatch = (newCustId || "").match(/(\d{4,})$/);
          const num = numMatch ? numMatch[1] : String(Math.max(1000, ...p.map(ll => parseInt((ll.custId || "").replace(/\D/g, "")) || 0)) + 1);
          newCustId = newLL ? `RBR-${newLL}-${num}` : `RBR-${num}`;
        }
        const updated = { ...l, ...editData, custId: newCustId, mipAmount: mip };
        // Keep leadId in sync if it was same as custId
        if (l.leadId === l.custId) updated.leadId = newCustId;
        saveLeadToDB(updated);
        return updated;
      }
      return l;
    }));
    setEditingLeadId(null);
    setEditData({});
  };
  const ed = (k, v) => setEditData(p => ({ ...p, [k]: v }));

  // Global Customer ID search
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSearchResult, setGlobalSearchResult] = useState(null);
  const searchByCustId = (query) => {
    if (!query.trim()) { setGlobalSearchResult(null); return; }
    const q = query.trim().toLowerCase();
    const matchedLead = leads.find(l =>
      (l.custId || "").toLowerCase().includes(q) ||
      (l.leadId || "").toLowerCase().includes(q) ||
      (l.name || "").toLowerCase().includes(q) ||
      (l.address || "").toLowerCase().includes(q)
    );
    if (matchedLead) {
      const matchedDeals = deals.filter(d => d.leadId === matchedLead.leadId || d.leadId === matchedLead.custId);
      const matchedCampaigns = campaigns.filter(camp => camp.leadIds.includes(matchedLead.id));
      const matchedMailings = (matchedLead.mailings || []);
      setGlobalSearchResult({ lead: matchedLead, deals: matchedDeals, campaigns: matchedCampaigns, mailings: matchedMailings });
    } else {
      setGlobalSearchResult({ lead: null, deals: [], campaigns: [], mailings: [] });
    }
  };

  // Marketing — campaigns, search, mail, convert
  const [mktView, setMktView] = useState("campaigns"); // campaigns | campaign_detail | lead_detail | convert
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const [mktLeadId, setMktLeadId] = useState(null);
  const [mktSearch, setMktSearch] = useState("");
  const [addingCampaign, setAddingCampaign] = useState(false);
  const [newCamp, setNewCamp] = useState({ name: "", date: "", notes: "", costPerPiece: "", hoursEstimate: "" });
  const [addingMail, setAddingMail] = useState(false);
  const [nm, snm] = useState({ stampType: "", envelopeType: "", dateSent: "", notes: "", cost: "" });
  const [convertData, setConvertData] = useState({ phone: "", email: "", dob: "", balance: "", propVal: "", estCosts: "" });

  const saveCampaign = () => {
    if (!newCamp.name.trim()) return;
    const camp = { ...newCamp, id: Date.now(), createdAt: new Date().toLocaleDateString(), leadIds: [] };
    setCampaigns(p => [camp, ...p]);
    sb.upsert("campaigns", { id: camp.id, name: camp.name, date: camp.date, notes: camp.notes, cost_per_piece: camp.costPerPiece, hours_estimate: camp.hoursEstimate, lead_ids: [], created_at: camp.createdAt });
    setNewCamp({ name: "", date: "", notes: "", costPerPiece: "", hoursEstimate: "" });
    setAddingCampaign(false);
  };
  const addLeadToCampaign = (campId, leadId) => {
    setCampaigns(p => p.map(c => {
      if (c.id === campId) { const updated = { ...c, leadIds: [...new Set([...c.leadIds, leadId])] }; sb.upsert("campaigns", { id: campId, lead_ids: updated.leadIds }); return updated; }
      return c;
    }));
  };
  const removeLeadFromCampaign = (campId, leadId) => {
    setCampaigns(p => p.map(c => {
      if (c.id === campId) { const updated = { ...c, leadIds: c.leadIds.filter(id => id !== leadId) }; sb.upsert("campaigns", { id: campId, lead_ids: updated.leadIds }); return updated; }
      return c;
    }));
  };
  const addMailToLead = (leadId) => {
    if (!nm.dateSent && !nm.stampType) return;
    const mail = { ...nm, id: Date.now(), campaignId: activeCampaignId };
    setLeads(p => p.map(l => l.id === leadId ? { ...l, mailings: [...(l.mailings || []), mail] } : l));
    sb.upsert("mailings", { customer_id: leadId, campaign_id: activeCampaignId, stamp_type: nm.stampType, envelope_type: nm.envelopeType, date_sent: nm.dateSent, notes: nm.notes, cost: nm.cost });
    snm({ stampType: "", envelopeType: "", dateSent: "", notes: "", cost: "" });
    setAddingMail(false);
  };
  const removeMailFromLead = (leadId, mailId) => {
    setLeads(p => p.map(l => l.id === leadId ? { ...l, mailings: (l.mailings || []).filter(m => m.id !== mailId) } : l));
    sb.del("mailings", { id: mailId });
  };
  const convertLead = (lead) => {
    const cd = convertData;
    const updatedLead = { ...lead, phone: cd.phone || lead.phone, email: cd.email || lead.email, converted: true, convertedAt: new Date().toLocaleDateString(), convertedCampaignId: activeCampaignId };
    setLeads(p => p.map(l => l.id === lead.id ? updatedLead : l));
    saveLeadToDB(updatedLead);
    const cvAge = calcAge(cd.dob);
    const cvPropVal = pn(cd.propVal);
    const cvBal = pn(cd.balance);
    const cvCosts = pn(cd.estCosts);
    const cvMCA = Math.min(cvPropVal, HECM_LIMIT);
    const cvER = cmtVal + 2.0;
    const cvPLF = cvAge ? getPLF(cvAge, cvER, false) : 0.45;
    const cvPL = cvMCA * (cvPLF || 0.45);
    const cvNet = Math.max(0, cvPL - cvBal - cvCosts);
    const cvIncome = cvPL * 0.0175;
    setDeals(prev => [{
      id: Date.now(), leadId: lead.leadId, name: lead.name, state: lead.state, dob: cd.dob, email: cd.email || lead.email,
      propertyValue: cvPropVal, currentBalance: cvBal, currentPL: 0, newPL: cvPL, newMCA: cvMCA,
      totalRefiCosts: cvCosts, netAvailable: cvNet, brokerIncome: cvIncome,
      lender: "FOA", productLabel: "HECM ARM", margin: 2.0,
      status: "Pitched", createdAt: new Date().toLocaleDateString(),
      passes3x1: false, passes5x1: false, passesProceeds: false, passesSeasoning: false,
      ratio3x1: "0.0", rateType: "arm", campaignId: activeCampaignId,
    }, ...prev]);
    setConvertData({ phone: "", email: "", dob: "", balance: "", propVal: "", estCosts: "" });
    setMktView("lead_detail");
  };

  // Campaign analytics helpers
  const getCampStats = (camp) => {
    const campLeads = leads.filter(l => camp.leadIds.includes(l.id));
    const allMailings = campLeads.flatMap(l => (l.mailings || []).filter(m => m.campaignId === camp.id));
    const totalLetters = allMailings.length;
    const totalCost = allMailings.reduce((s, m) => s + (parseFloat(m.cost) || 0), 0) + (parseFloat(camp.costPerPiece || 0) > 0 && totalLetters > 0 ? 0 : 0); // individual costs only
    const totalHours = parseFloat(camp.hoursEstimate) || 0;
    const convertedLeads = campLeads.filter(l => l.converted);
    const convertedLeadIds = convertedLeads.map(l => l.leadId);
    const fundedDeals = deals.filter(d => d.status === "Funded" && (convertedLeadIds.includes(d.leadId) || d.campaignId === camp.id));
    const fundedComp = fundedDeals.reduce((s, d) => s + d.brokerIncome, 0);
    const allCampDeals = deals.filter(d => convertedLeadIds.includes(d.leadId) || d.campaignId === camp.id);
    const pipelineComp = allCampDeals.reduce((s, d) => s + d.brokerIncome, 0);
    const roi = totalCost > 0 ? ((fundedComp - totalCost) / totalCost * 100) : 0;
    return { totalLetters, totalCost, totalHours, convertedCount: convertedLeads.length, fundedDeals, fundedComp, pipelineComp, allCampDeals, roi, campLeads };
  };

  // Global marketing totals
  const allMailings = leads.flatMap(l => l.mailings || []);
  const globalTotalLetters = allMailings.length;
  const globalTotalCost = allMailings.reduce((s, m) => s + (parseFloat(m.cost) || 0), 0);
  const globalTotalHours = campaigns.reduce((s, c) => s + (parseFloat(c.hoursEstimate) || 0), 0);
  const globalFundedFromMarketing = deals.filter(d => d.status === "Funded" && d.campaignId);
  const globalFundedComp = globalFundedFromMarketing.reduce((s, d) => s + d.brokerIncome, 0);

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
  const mktLead = leads.find(l => l.id === mktLeadId);
  const filteredLeads = mktSearch.trim() ? leads.filter(l =>
    l.name.toLowerCase().includes(mktSearch.toLowerCase()) ||
    l.leadId.toLowerCase().includes(mktSearch.toLowerCase()) ||
    (l.custId || "").toLowerCase().includes(mktSearch.toLowerCase()) ||
    (l.address || "").toLowerCase().includes(mktSearch.toLowerCase()) ||
    l.state.toLowerCase().includes(mktSearch.toLowerCase())
  ) : leads;

  const totalPipelineIncome = deals.reduce((s, d) => s + d.brokerIncome, 0);
  const fundedIncome = deals.filter(d => d.status === "Funded").reduce((s, d) => s + d.brokerIncome, 0);
  const activeDeals = deals.filter(d => d.status !== "Funded" && d.status !== "Fallout");
  const productKeys = Object.keys(lender.products);

  // Email modal deal
  const emailDeal = emailModal ? deals.find(d => d.id === emailModal.dealId) : null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet" />

      {/* ═══════ PASSCODE GATE + EMAIL MFA ═══════ */}
      {!authenticated ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
          <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 32, maxWidth: 380, width: "100%", textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 800, color: C.accent, marginBottom: 4 }}>Reverse by Reece</div>
            <div style={{ fontSize: 12, color: C.textDim, marginBottom: 20 }}>by Reece</div>

            {/* Step indicators */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 20 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: mfaStep >= 1 ? C.accentDim : C.accent, border: `1.5px solid ${C.accent}`, color: mfaStep >= 1 ? C.accent : "#000", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{mfaStep >= 1 ? "✓" : "1"}</div>
              <div style={{ width: 24, height: 1, background: mfaStep >= 1 ? C.accent : C.divider }} />
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: mfaStep >= 3 ? C.accentDim : mfaStep >= 1 ? C.accent : C.input, border: `1.5px solid ${mfaStep >= 1 ? C.accent : C.inputBorder}`, color: mfaStep >= 3 ? C.accent : mfaStep >= 1 ? "#000" : C.textDim, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{mfaStep >= 3 ? "✓" : "2"}</div>
              <div style={{ width: 24, height: 1, background: mfaStep >= 3 ? C.accent : C.divider }} />
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: mfaStep === 3 ? C.accent : C.input, border: `1.5px solid ${mfaStep === 3 ? C.accent : C.inputBorder}`, color: mfaStep === 3 ? "#000" : C.textDim, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>3</div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 8, color: mfaStep === 0 ? C.accent : C.textDim, fontWeight: 600 }}>Passcode</div>
              <div style={{ fontSize: 8, color: mfaStep === 1 || mfaStep === 2 ? C.accent : C.textDim, fontWeight: 600 }}>Email</div>
              <div style={{ fontSize: 8, color: mfaStep === 3 ? C.accent : C.textDim, fontWeight: 600 }}>Verify</div>
            </div>

            {/* ── Step 0: Passcode ── */}
            {mfaStep === 0 && (<>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14 }}>Enter your passcode to continue</div>
              <input
                type="password"
                value={passcode}
                onChange={e => { setPasscode(e.target.value); setPasscodeError(false); }}
                onKeyDown={e => { if (e.key === "Enter") { if (passcode === "85233") setMfaStep(1); else { setPasscodeError(true); setPasscode(""); } } }}
                placeholder="•••••"
                style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px", background: C.input, border: `1px solid ${passcodeError ? C.danger : C.inputBorder}`, borderRadius: 10, color: C.text, fontSize: 20, fontFamily: "'DM Mono',monospace", textAlign: "center", letterSpacing: "0.3em", outline: "none", marginBottom: 12 }}
              />
              {passcodeError && <div style={{ fontSize: 11, color: C.danger, marginBottom: 10 }}>Incorrect passcode. Try again.</div>}
              <button
                onClick={() => { if (passcode === "85233") setMfaStep(1); else { setPasscodeError(true); setPasscode(""); } }}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "none", background: C.accent, color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                Continue →
              </button>
            </>)}

            {/* ── Step 1: Email Input ── */}
            {mfaStep === 1 && (<>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 22 }}>✉️</div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 4 }}>Email Verification</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 16, lineHeight: 1.5 }}>We'll send a 6-digit code to your email to confirm your identity.</div>
              <input
                type="email"
                value={mfaEmail}
                onChange={e => setMfaEmail(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendMfaEmail(); }}
                placeholder="reece@example.com"
                style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 10, color: C.text, fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", marginBottom: 12 }}
              />
              <button
                onClick={sendMfaEmail}
                disabled={!mfaEmail || !mfaEmail.includes("@")}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "none", background: mfaEmail && mfaEmail.includes("@") ? C.accent : C.input, color: mfaEmail && mfaEmail.includes("@") ? "#000" : C.textDim, fontSize: 14, fontWeight: 700, cursor: mfaEmail && mfaEmail.includes("@") ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
                Send Verification Code
              </button>
              <button
                onClick={() => { setMfaStep(0); setPasscode(""); }}
                style={{ width: "100%", padding: "8px 16px", borderRadius: 8, border: "none", background: "none", color: C.textDim, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                ← Back
              </button>
            </>)}

            {/* ── Step 2: Sending Animation ── */}
            {mfaStep === 2 && (<>
              <div style={{ padding: "30px 0" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", position: "relative" }}>
                  <div style={{ fontSize: 24 }}>✉️</div>
                  {/* Animated ring */}
                  <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2px solid ${C.accent}`, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                </div>
                <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 6 }}>Sending verification code{mfaSendDots}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>{maskEmail(mfaEmail)}</div>
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </>)}

            {/* ── Step 3: Code Entry ── */}
            {mfaStep === 3 && (<>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 22 }}>🔐</div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 4 }}>Check your inbox</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
                We sent a 6-digit code to <span style={{ color: C.accent, fontWeight: 600 }}>{maskEmail(mfaEmail)}</span>
              </div>

              {/* Simulated "email" preview */}
              <div style={{ background: "#0a0f1a", border: `1px solid ${C.divider}`, borderRadius: 10, padding: 14, marginBottom: 14, textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${C.divider}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>🔒</div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.text }}>Reverse by Reece</div>
                    <div style={{ fontSize: 8, color: C.textDim }}>security@reversebyreece.com · just now</div>
                  </div>
                </div>
                <div style={{ fontSize: 9, color: C.textDim, marginBottom: 8 }}>Your verification code is:</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 36, fontWeight: 700, color: C.accent, textAlign: "center", letterSpacing: "0.35em", padding: "8px 0", background: C.accentDim, borderRadius: 8, marginBottom: 8 }}>{mfaCode}</div>
                <div style={{ fontSize: 8, color: C.textDim, lineHeight: 1.5 }}>This code expires in {Math.floor(mfaCountdown / 60)}:{String(mfaCountdown % 60).padStart(2, "0")}. If you didn't request this, you can safely ignore this email.</div>
              </div>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={mfaInput}
                onChange={e => { setMfaInput(e.target.value.replace(/\D/g, "").slice(0, 6)); setMfaError(false); }}
                onKeyDown={e => { if (e.key === "Enter" && mfaInput.length === 6) verifyMfa(); }}
                placeholder="Enter 6-digit code"
                style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px", background: C.input, border: `1px solid ${mfaError ? C.danger : C.inputBorder}`, borderRadius: 10, color: C.text, fontSize: 22, fontFamily: "'DM Mono',monospace", textAlign: "center", letterSpacing: "0.4em", outline: "none", marginBottom: 12 }}
              />
              {mfaError && <div style={{ fontSize: 11, color: C.danger, marginBottom: 10 }}>Incorrect code. Please try again.</div>}

              <button
                onClick={verifyMfa}
                disabled={mfaInput.length !== 6}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "none", background: mfaInput.length === 6 ? C.accent : C.input, color: mfaInput.length === 6 ? "#000" : C.textDim, fontSize: 14, fontWeight: 700, cursor: mfaInput.length === 6 ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
                Verify & Unlock
              </button>

              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 4 }}>
                <button onClick={resendCode} style={{ background: "none", border: "none", color: C.accent, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
                  Resend code
                </button>
                <span style={{ color: C.divider }}>·</span>
                <button onClick={() => { setMfaStep(1); setMfaCode(""); setMfaInput(""); }} style={{ background: "none", border: "none", color: C.textDim, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                  Change email
                </button>
              </div>

              {/* Countdown */}
              <div style={{ marginTop: 12, fontSize: 9, color: mfaCountdown <= 60 ? C.danger : C.textDim }}>
                Code expires in {Math.floor(mfaCountdown / 60)}:{String(mfaCountdown % 60).padStart(2, "0")}
              </div>
            </>)}

            <div style={{ fontSize: 9, color: C.textDim, marginTop: 16, borderTop: `1px solid ${C.divider}`, paddingTop: 12 }}>HECM-to-HECM Refi Calculator · Broker CRM</div>
          </div>
        </div>
      ) : (<>
      {/* ═══════ AUTHENTICATED APP ═══════ */}

      {/* Email Modal */}
      {emailModal && emailDeal && (
        <EmailModal status={emailModal.status} deal={emailDeal} onClose={() => setEmailModal(null)} />
      )}

      {/* NAV */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(11,17,32,0.95)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.divider}` }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "8px 12px 0" }}>
          <div style={{ textAlign: "center", marginBottom: 6 }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 800, color: C.accent }}>Reverse by Reece</span>
            <span style={{ fontSize: 10, color: C.textDim, marginLeft: 6 }}>by Reece</span>
          </div>
          <div style={{ display: "flex", gap: 0 }}>
            {[
              { k: "dashboard", l: "Home" },
              { k: "calculator", l: "Calc" },
              { k: "pipeline", l: `Pipeline` },
              { k: "active", l: `Active` },
              { k: "leads", l: `Leads` },
              { k: "marketing", l: "Mktg" },
              { k: "tasks", l: "Tasks" },
              { k: "more", l: "More" },
            ].map(n => (
              <button key={n.k} onClick={() => { setView(n.k); setEditingDeal(null); if (n.k === "marketing") { setMktView("campaigns"); setMktLeadId(null); setActiveCampaignId(null); } }} style={{ flex: 1, padding: "9px 1px", background: "none", border: "none", borderBottom: view === n.k ? `2px solid ${C.accent}` : "2px solid transparent", color: view === n.k ? C.accent : C.textDim, fontSize: 9, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>{n.l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 12px", maxWidth: 560, margin: "0 auto" }}>

        {/* ═══════ CALCULATOR ═══════ */}
        {view === "calculator" && (<>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 3px" }}>HECM-to-HECM Refi Calculator</h1>
            <p style={{ color: C.textDim, fontSize: 10, margin: 0 }}>Fixed & ARM · HomeSafe · SecureEquity · Broker Comp</p>
          </div>

          <Card>
            <Hdr>Deal Info</Hdr>
            <Inp small id="lid" label="Customer ID / Name / Address" value={c.leadId} onChange={e => u("leadId", e.target.value)} placeholder="e.g. RBR-1001 or 123 Main St" hint="Search by ID, name, or address · auto-fills from lead" />
            {c.leadId.trim() && (() => {
              const q = c.leadId.trim().toLowerCase();
              const matchedLead = leads.find(l => (l.custId || "").toLowerCase() === q || (l.leadId || "").toLowerCase() === q || (l.name || "").toLowerCase() === q || (l.name || "").toLowerCase().includes(q) || (l.address || "").toLowerCase().includes(q));
              if (matchedLead && c.name !== matchedLead.name) {
                return (
                  <button onClick={() => {
                    u("name", matchedLead.name); u("state", matchedLead.state); u("leadId", matchedLead.custId);
                    if (matchedLead.email) u("email", matchedLead.email);
                    if (matchedLead.phone) u("phone", matchedLead.phone);
                    if (matchedLead.address) u("address", matchedLead.address);
                    if (matchedLead.dob) u("dob", matchedLead.dob);
                    if (matchedLead.interestRate) u("interestRate", matchedLead.interestRate);
                    if (matchedLead.origMortgageDate) u("origClose", matchedLead.origMortgageDate);
                    if (pn(matchedLead.maxClaim) > 0) {
                      u("origMCA", String(pn(matchedLead.maxClaim)));
                      u("origIMIP", String(Math.round(calcMIP(matchedLead.maxClaim))));
                    }
                  }}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.accent}44`, background: C.accentDim, color: C.accent, fontSize: 10, fontWeight: 600, cursor: "pointer", marginBottom: 8, textAlign: "left" }}>
                    ⚡ Found: {matchedLead.name} ({matchedLead.state}){matchedLead.address ? ` · ${matchedLead.address}` : ""}{matchedLead.phone ? ` · ${matchedLead.phone}` : ""}{matchedLead.interestRate ? ` · ${matchedLead.interestRate}%` : ""}{pn(matchedLead.maxClaim) > 0 ? ` · MIP: ${fmt(calcMIP(matchedLead.maxClaim))}` : ""} — Click to auto-fill
                  </button>
                );
              }
              return null;
            })()}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
              <Inp small id="bn" label="Borrower Name" value={c.name} onChange={e => u("name", e.target.value)} />
              <Sel id="bs" label="State" value={c.state} onChange={e => u("state", e.target.value)} options={US_STATES.map(s => ({ v: s, l: s }))} />
            </div>
            {c.address && <div style={{ fontSize: 9, color: C.textDim, marginTop: -2, marginBottom: 4 }}>📍 {c.address}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Inp small id="em" label="Email" value={c.email} onChange={e => u("email", e.target.value)} placeholder="borrower@email.com" />
              <Inp small id="ph" label="Phone" value={c.phone} onChange={e => u("phone", e.target.value)} placeholder="(555) 123-4567" />
            </div>
          </Card>

          <Card>
            <Hdr>Existing HECM Loan</Hdr>
            <Inp small id="oc" label="Original Closing Date" type="date" value={c.origClose} onChange={e => u("origClose", e.target.value)} hint={monthsSeasoned !== null ? `${monthsSeasoned}mo ${seasoningPass ? "✓" : "✗ Need 18+"}` : "18-month seasoning"} />
            <Inp small id="cir" label="Current Interest Rate" value={c.interestRate} onChange={e => u("interestRate", e.target.value)} suffix="%" placeholder="e.g. 6.250" hint="Current note rate on existing loan" />
            <Inp small id="cb" label="Current Balance (Payoff)" value={c.curBal} onChange={e => u("curBal", e.target.value)} prefix="$" />
            <Inp small id="cp" label="Current Principal Limit" value={c.curPL} onChange={e => u("curPL", e.target.value)} prefix="$" />
            <Inp small id="om" label="Original MCA" value={c.origMCA} onChange={e => u("origMCA", e.target.value)} prefix="$" hint={getLLCode(c.origMCA, c.origClose) ? `${getLLCode(c.origMCA, c.origClose)} Loan Limit` : ""} />
            <Inp small id="oi" label="Original IMIP Paid" value={c.origIMIP} onChange={e => u("origIMIP", e.target.value)} prefix="$" />
          </Card>

          <Card>
            <Hdr>New Loan Details</Hdr>
            <Inp small id="dob" label="DOB (Youngest Borrower/NBS)" type="date" value={c.dob} onChange={e => u("dob", e.target.value)} hint={age ? `Age ${age} ${ageOk ? "✓" : `✗ Need ${product?.minAge}+`}` : `Min age ${product?.minAge}`} />
            <Inp small id="pv" label="Property Value" value={c.propVal} onChange={e => u("propVal", e.target.value)} prefix="$" hint={propVal > maxLoanAmt ? `Cap: ${fmt(maxLoanAmt)}` : ""} />
            <Inp small id="cmt" label="10-Yr CMT Index" value={c.cmtIndex} onChange={e => u("cmtIndex", e.target.value)} suffix="%" />
            <Inp small id="of" label="Origination Fee" value={c.origFee} onChange={e => u("origFee", e.target.value)} prefix="$" hint="Max $6,000 (HECM)" />
            <Inp small id="oc2" label="Other Closing Costs" value={c.otherCosts} onChange={e => u("otherCosts", e.target.value)} prefix="$" />
          </Card>

          {/* ══ RUN PRICING ══ */}
          <button onClick={runPricing} style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #10B981, #059669)", color: "#000", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", marginBottom: 12, letterSpacing: "0.03em", boxShadow: "0 4px 20px rgba(16,185,129,0.25)" }}>
            ▶ Run Pricing — All Lenders
          </button>

          {/* ══ PRICING RESULTS ══ */}
          {pricingResults && (
            <Card style={{ borderColor: `${C.accent}44`, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Pricing Results</div>
                  <div style={{ fontSize: 9, color: C.textDim }}>{pricingResults.length} options · Sorted by highest comp</div>
                </div>
                <button onClick={() => setPricingResults(null)} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: C.textDim, fontSize: 10, padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}>✕ Close</button>
              </div>

              {/* Sort tabs */}
              <div style={{ display: "flex", gap: 3, marginBottom: 10 }}>
                {[["brokerComp","💰 Comp"],["netFunds","🏦 Net Funds"],["initRate","📈 Rate ↓"],["premium","⭐ Premium"]].map(([k,l]) => (
                  <button key={k} onClick={() => {
                    setPricingSortBy(k);
                    setPricingResults(prev => [...prev].sort((a,b) => {
                      if (k === "brokerComp") return b.brokerComp - a.brokerComp;
                      if (k === "netFunds") return b.netFunds - a.netFunds;
                      if (k === "initRate") return a.initRate - b.initRate;
                      if (k === "premium") return b.premium - a.premium;
                      return 0;
                    }));
                  }} style={{ flex: 1, padding: "5px 2px", borderRadius: 6, border: `1px solid ${pricingSortBy === k ? C.accent : C.inputBorder}`, background: pricingSortBy === k ? C.accentDim : "transparent", color: pricingSortBy === k ? C.accent : C.textDim, fontSize: 8, fontWeight: 600, cursor: "pointer" }}>{l}</button>
                ))}
              </div>

              {/* Results list */}
              <div style={{ maxHeight: 500, overflowY: "auto" }}>
                {pricingResults.map((r, i) => {
                  const isBest = i === 0;
                  return (
                    <div key={i} onClick={() => selectPricingResult(r)} style={{
                      display: "flex", flexDirection: "column", gap: 4, padding: "10px 10px",
                      background: isBest ? "rgba(16,185,129,0.06)" : "transparent",
                      border: `1px solid ${isBest ? "rgba(16,185,129,0.2)" : C.divider}`,
                      borderRadius: 10, marginBottom: 4, cursor: "pointer",
                      position: "relative",
                    }}>
                      {isBest && <div style={{ position: "absolute", top: 6, right: 8, fontSize: 7, fontWeight: 700, color: "#000", background: C.accent, padding: "2px 6px", borderRadius: 4 }}>BEST</div>}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.lenderColor, flexShrink: 0 }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{r.lender}</div>
                        <div style={{ fontSize: 9, color: C.textMuted }}>·</div>
                        <div style={{ fontSize: 10, color: r.isProp ? C.teal : r.lenderColor, fontWeight: 600 }}>{r.product}</div>
                        {r.isFixed && <span style={{ fontSize: 7, color: C.textDim, background: C.input, padding: "1px 4px", borderRadius: 3, fontWeight: 600 }}>FIXED</span>}
                        {!r.isFixed && <span style={{ fontSize: 7, color: C.textDim, background: C.input, padding: "1px 4px", borderRadius: 3, fontWeight: 600 }}>ARM</span>}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}>
                        <div>
                          <div style={{ fontSize: 7, color: C.textDim, fontWeight: 600, textTransform: "uppercase" }}>Broker Comp</div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 700, color: C.accent }}>{fmt(r.brokerComp)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 7, color: C.textDim, fontWeight: 600, textTransform: "uppercase" }}>Net Funds</div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 700, color: r.netFunds > 0 ? C.gold : C.danger }}>{fmt(r.netFunds)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 7, color: C.textDim, fontWeight: 600, textTransform: "uppercase" }}>Rate</div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 600, color: C.text }}>{r.initRate.toFixed(2)}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 7, color: C.textDim, fontWeight: 600, textTransform: "uppercase" }}>Premium</div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 600, color: C.text }}>{r.premium.toFixed(2)}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                        <div style={{ fontSize: 8, color: C.textDim }}>{r.isFixed ? `${r.noteRate}% note` : `${r.margin}% margin`}</div>
                        <div style={{ fontSize: 8, color: C.textDim }}>PL: {fmt(r.newPL)}</div>
                        <div style={{ fontSize: 8, color: r.passes3x1 ? C.pass : C.fail }}>{r.ratio3x1.toFixed(1)}x {r.passes3x1 ? "✓" : "✗"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, fontSize: 8 }}>
                        <span style={{ color: C.accent }}>SRP: {fmt(r.srpOnUPB)}</span>
                        <span style={{ color: C.gold }}>Orig: {fmt(r.brokerOrig)}</span>
                        <span style={{ color: C.textDim }}>UPB: {fmt(r.newUPB)}</span>
                        {r.lesaRate && <span style={{ color: C.textDim }}>LESA: {r.lesaRate.toFixed(2)}%</span>}
                        <button onClick={(e) => { e.stopPropagation(); sendResultToPipeline(r); }}
                          style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.accent}55`, background: C.accentDim, color: C.accent, fontSize: 8, fontWeight: 700, cursor: "pointer" }}>➕ Pipeline</button>
                      </div>
                    </div>
                  );
                })}
                {pricingResults.length === 0 && <div style={{ textAlign: "center", padding: 20, fontSize: 12, color: C.textDim }}>No eligible products found for this borrower profile.</div>}
              </div>
            </Card>
          )}

          {/* LENDER + PRODUCT + TIER — only shows after selecting a pricing result */}
          {selectedResult && (
          <Card>
            <Hdr>Lender & Product</Hdr>
            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
              {Object.entries(LENDERS).map(([k, l]) => (
                <button key={k} onClick={() => { u("lenderKey", k); const pk = Object.keys(l.products); u("productKey", pk[0]); u("tierIdx", 2); }} style={{ flex: 1, padding: "7px 5px", borderRadius: 7, border: `1px solid ${c.lenderKey === k ? l.color : C.inputBorder}`, background: c.lenderKey === k ? l.colorDim : "transparent", color: c.lenderKey === k ? l.color : C.textDim, fontSize: 10, fontWeight: 600, cursor: "pointer", outline: "none", lineHeight: 1.3 }}>
                  {l.name}<div style={{ fontSize: 8, opacity: 0.7, marginTop: 1 }}>{l.nmls}</div>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 3, marginBottom: 10, flexWrap: "wrap" }}>
              {productKeys.map(pk => {
                const p = lender.products[pk]; const sel = c.productKey === pk;
                const pColor = p.rateType.includes("prop") ? C.teal : lender.color;
                return (
                  <button key={pk} onClick={() => { u("productKey", pk); u("tierIdx", Math.min(2, p.tiers.length - 1)); }} style={{ flex: "1 1 auto", padding: "5px 6px", borderRadius: 6, border: `1px solid ${sel ? pColor : C.inputBorder}`, background: sel ? `${pColor}22` : "transparent", color: sel ? pColor : C.textDim, fontSize: 9, fontWeight: 600, cursor: "pointer", outline: "none", lineHeight: 1.3, minWidth: 0 }}>
                    {p.label}<div style={{ fontSize: 7, opacity: 0.7, marginTop: 1, fontWeight: 400 }}>{p.desc.split("·")[0].trim()}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ background: C.input, borderRadius: 6, padding: "6px 10px", marginBottom: 10, fontSize: 9, color: C.textMuted, display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span>Rate: <strong style={{ color: C.text }}>{product?.rateType?.includes("arm") ? "Adjustable" : "Fixed"}</strong></span>
              <span>Draw: <strong style={{ color: C.text }}>{product?.fullDraw ? "Full Lump Sum" : "Flexible"}</strong></span>
              <span>MIP: <strong style={{ color: C.text }}>{product?.hasMIP ? "Yes" : "None"}</strong></span>
              <span>Max: <strong style={{ color: C.text }}>{fmt(product?.maxLoan)}</strong></span>
              <span>Age: <strong style={{ color: C.text }}>{product?.minAge}+</strong></span>
            </div>
            <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${C.cardBorder}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", background: C.input, padding: "5px 8px" }}>
                {[isFixed ? "Rate" : "Margin", "Broker", "Credit", "Exp Rate"].map(h => <div key={h} style={{ fontSize: 8, fontWeight: 600, textTransform: "uppercase", color: C.textDim }}>{h}</div>)}
              </div>
              {product?.tiers.map((t, i) => {
                const sel = i === c.tierIdx;
                const acColor = isProp ? C.teal : lender.color;
                const expR = isFixed ? t.noteRate : (cmtVal + t.margin);
                return (
                  <div key={i} onClick={() => u("tierIdx", i)} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", padding: "7px 8px", cursor: "pointer", background: sel ? `${acColor}18` : "transparent", borderLeft: sel ? `3px solid ${acColor}` : "3px solid transparent", borderBottom: i < product.tiers.length - 1 ? `1px solid ${C.divider}` : "none" }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: sel ? 700 : 500, color: sel ? acColor : C.text }}>{isFixed ? t.label : `${t.margin.toFixed(2)}%`}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.accent, fontWeight: 600 }}>{t.brokerComp.toFixed(2)}%</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: t.lenderCredit > 0 ? C.warning : C.textDim }}>{t.lenderCredit > 0 ? `${t.lenderCredit.toFixed(2)}%` : "—"}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.textMuted }}>{expR.toFixed(2)}%</div>
                  </div>
                );
              })}
            </div>
          </Card>
          )}

          {(selectedResult || newPL > 0) && (<>
          <Card style={{ borderColor: allPass ? `${C.pass}44` : `${C.fail}44` }}>
            <Hdr>Refinance Qualification Tests</Hdr>
            <TestResult label="18-Month Seasoning" pass={seasoningPass} detail={monthsSeasoned !== null ? `${monthsSeasoned}mo (need 18+)` : "Enter closing date"} />
            <TestResult label="3:1 Closing Cost Test" pass={pass3} detail={totalRefiCosts > 0 ? `${fmt(plIncrease)} ÷ ${fmt(totalRefiCosts)} = ${ratio3.toFixed(1)}x (need ≥3x)` : "Enter costs"} />
            <TestResult label="5:1 Test (Counseling Waiver)" pass={pass5} detail={totalRefiCosts > 0 ? `${ratio5.toFixed(1)}x (need ≥5x)` : "Enter costs"} />
            <TestResult label="5% Net Proceeds" pass={passProceed} detail={newPL > 0 ? `${fmt(netFunds)} vs ${fmt(thresh5pct)}` : "Enter info"} />
            {!ageOk && age !== null && <TestResult label={`Min Age (${product?.minAge}+)`} pass={false} detail={`Borrower is ${age}`} />}
            <div style={{ marginTop: 8, padding: 10, borderRadius: 7, background: allPass ? C.accentDim : C.dangerDim, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: allPass ? C.pass : C.fail }}>{allPass ? "✓ QUALIFIES" : "✗ DOES NOT QUALIFY"}</div>
              <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>
                {pass3 && !pass5 ? "Passes 3:1 — counseling required. " : ""}{pass5 ? "Meets 5:1 — may waive counseling. " : ""}{isProp ? "Proprietary — FHA tests shown for reference." : ""}
              </div>
            </div>
          </Card>

          <Card>
            <Hdr>Analysis — {product?.label} via {lender.short}</Hdr>
            <Row label="Expected Rate" value={`${expectedRate.toFixed(2)}%`} color={isProp ? C.teal : lender.color} border />
            <Row label="New MCA" value={newMCA > 0 ? fmt(newMCA) : "—"} border />
            <Row label="PLF" value={plf ? `${(plf * 100).toFixed(1)}%` : "—"} border />
            <Row label="New Principal Limit" value={newPL > 0 ? fmt(newPL) : "—"} color={C.accent} border />
            <Row label="PL Increase" value={plIncrease > 0 ? fmt(plIncrease) : "—"} color={C.accent} border />
            <Row label="Total Refi Cost" value={totalRefiCosts > 0 ? fmt(totalRefiCosts) : "—"} color={C.danger} border />
            <Row label="New UPB at Close" value={newUPB > 0 ? fmt(newUPB) : "—"} border />
            <Row label="Premium" value={mainPremium ? `${mainPremium.toFixed(2)}` : "—"} color={mainPremium > 100 ? C.accent : C.textDim} border />
            {product?.hasMIP && <Row label="MIP Credit (Savings)" value={newMCA > 0 ? fmt(Math.max(0, (newMCA * 0.02) - newIMIP)) : "—"} color={C.accent} border />}
            {!product?.hasMIP && <Row label="MIP" value="None (Proprietary)" color={C.accent} border />}
            <div style={{ background: C.goldDim, border: `1px solid rgba(212,168,67,0.25)`, borderRadius: 8, padding: 12, textAlign: "center", marginTop: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", color: C.gold, marginBottom: 3 }}>Net Available to Borrower</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 24, fontWeight: 700, color: C.gold }}>{newPL > 0 ? fmt(netAvailable) : "—"}</div>
              {product?.fullDraw && <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>Full draw required at close</div>}
            </div>
            <div style={{ background: C.accentDim, border: `1px solid rgba(16,185,129,0.25)`, borderRadius: 8, padding: 12, textAlign: "center", marginTop: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", color: C.accent, marginBottom: 3 }}>Broker Income (Est.)</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 22, fontWeight: 700, color: C.accent }}>{newPL > 0 ? fmt(brokerComp$) : "—"}</div>
              <div style={{ fontSize: 9, color: C.textDim, marginTop: 4, lineHeight: 1.6 }}>
                SRP: {fmt(srpOnUPB)} ({(mainPremium - 100).toFixed(2)}% on {fmt(newUPB)} UPB)<br/>
                Orig: {fmt(Math.max(0, brokerOrig))}{lenderCredit$ > 0 ? ` + ${fmt(lenderCredit$)} credit` : ""}
              </div>
            </div>
          </Card>
          </>)}

          {(selectedResult || newPL > 0) && <Btn primary onClick={saveDeal} style={{ width: "100%", marginBottom: 16 }}>💾 Save Deal to Pipeline</Btn>}
        </>)}

        {/* ═══════ PIPELINE ═══════ */}
        {view === "pipeline" && !editingDeal && (<>
          {/* Confetti */}
          {showConfetti > 0 && (<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
            {Array.from({ length: showConfetti > 1 ? 80 : 30 }).map((_, i) => {
              const colors = ["#10B981","#22C55E","#FBBF24","#F97316","#60A5FA","#A78BFA","#F87171","#E879F9","#A3E635"];
              const col = colors[Math.floor(Math.random() * colors.length)];
              const left = Math.random() * 100;
              const delay = Math.random() * 2;
              const dur = 2 + Math.random() * 2;
              const size = showConfetti > 1 ? 8 + Math.random() * 8 : 6 + Math.random() * 6;
              const shape = showConfetti > 1 && i % 5 === 0 ? "🎈" : "";
              return shape ? (
                <div key={i} style={{ position: "absolute", left: `${left}%`, top: -20, fontSize: size * 2, animation: `confettiFall ${dur}s ${delay}s ease-out forwards`, opacity: 0 }}>{shape}</div>
              ) : (
                <div key={i} style={{ position: "absolute", left: `${left}%`, top: -10, width: size, height: size, background: col, borderRadius: i % 3 === 0 ? "50%" : "1px", animation: `confettiFall ${dur}s ${delay}s ease-out forwards`, opacity: 0, transform: `rotate(${Math.random()*360}deg)` }} />
              );
            })}
            <style>{`@keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity:1; } 100% { transform: translateY(100vh) rotate(720deg); opacity:0; } }`}</style>
          </div>)}

          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>Deal Pipeline</h2>
            {/* Pipeline filter */}
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {[{k:"active",l:"Active Pipeline",c:C.accent},{k:"funded",l:"Funded",c:C.gold},{k:"fallout",l:"Fallout",c:C.danger},{k:"all",l:"All",c:C.textDim}].map(f => (
                <button key={f.k} onClick={() => setPipelineFilter(f.k)}
                  style={{ flex: 1, padding: "6px 4px", borderRadius: 6, border: `1px solid ${pipelineFilter === f.k ? f.c : C.inputBorder}`, background: pipelineFilter === f.k ? `${f.c}22` : "transparent", color: pipelineFilter === f.k ? f.c : C.textDim, fontSize: 9, fontWeight: 600, cursor: "pointer" }}>{f.l}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, background: C.accentDim, borderRadius: 8, padding: 10, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.accent, fontWeight: 600, textTransform: "uppercase" }}>Total Pipeline</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: C.accent }}>{fmt(totalPipelineIncome)}</div>
                <div style={{ fontSize: 9, color: C.textDim }}>{deals.filter(d => d.status !== "Funded" && d.status !== "Fallout").length} deals</div>
              </div>
              <div style={{ flex: 1, background: C.goldDim, borderRadius: 8, padding: 10, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.gold, fontWeight: 600, textTransform: "uppercase" }}>Funded Income</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: C.gold }}>{fmt(fundedIncome)}</div>
                <div style={{ fontSize: 9, color: C.textDim }}>{deals.filter(d => d.status === "Funded").length} funded</div>
              </div>
            </div>
          </div>
          {(() => {
            let filtered = deals;
            if (pipelineFilter === "active") filtered = deals.filter(d => d.status !== "Funded" && d.status !== "Fallout");
            else if (pipelineFilter === "funded") filtered = deals.filter(d => d.status === "Funded");
            else if (pipelineFilter === "fallout") filtered = deals.filter(d => d.status === "Fallout");
            return filtered.length === 0 ? (
              <Card><div style={{ textAlign: "center", padding: 24, color: C.textDim, fontSize: 12 }}>No {pipelineFilter === "all" ? "" : pipelineFilter} deals.</div></Card>
            ) : (<>
              <div style={{ display: "flex", gap: 3, marginBottom: 10, flexWrap: "wrap" }}>
                {STATUSES.map(s => { const ct = filtered.filter(d => d.status === s).length; return ct > 0 ? <Badge key={s} color={STATUS_COLORS[s]} bg={`${STATUS_COLORS[s]}22`}>{s} ({ct})</Badge> : null; })}
              </div>
              {filtered.map(d => (
                <Card key={d.id}>
                  <div onClick={() => setEditingDeal(d.id)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{d.name} <span style={{ fontSize: 10, color: C.textDim, fontWeight: 500 }}>ID: {d.leadId}</span></div>
                      <div style={{ fontSize: 10, color: C.textDim, marginTop: 1 }}>{d.state} · {d.productLabel} · {LENDERS[d.lender]?.short} · {d.createdAt}</div>
                      {d.phone && <div style={{ fontSize: 9, color: C.textDim }}>📞 {d.phone}</div>}
                    </div>
                    <Badge color={STATUS_COLORS[d.status]} bg={`${STATUS_COLORS[d.status]}22`}>{d.status}</Badge>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                    <div><div style={{ fontSize: 8, color: C.textDim, textTransform: "uppercase" }}>New PL</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: C.text }}>{fmtShort(d.newPL)}</div></div>
                    <div><div style={{ fontSize: 8, color: C.textDim, textTransform: "uppercase" }}>Net</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: C.gold }}>{fmtShort(d.netAvailable)}</div></div>
                    <div><div style={{ fontSize: 8, color: C.textDim, textTransform: "uppercase" }}>Broker $</div><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: C.accent, fontWeight: 700 }}>{fmtShort(d.brokerIncome)}</div></div>
                  </div>
                  {/* Status buttons */}
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 6 }}>
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => {
                        const prev = d.status;
                        const updates = { status: s };
                        if (s === "Sent to Lender" && !d.sentToLenderAt) updates.sentToLenderAt = Date.now();
                        if (s === "Submit CTC") { setShowConfetti(1); setTimeout(() => setShowConfetti(0), 4000); }
                        if (s === "CTC") { setShowConfetti(2); setTimeout(() => setShowConfetti(0), 5000); }
                        if (s === "Funded" && d.email) {
                          const subj = `Great News — Your Loan Has Funded!`;
                          const body = `Dear ${d.name.split(" ")[0]},\n\nGreat news! Everything has been funded without issue.\n\nYou should expect information in the coming weeks regarding the servicing of your loan. If you have any questions at all, please don't hesitate to reach out to me.\n\nI'll certainly keep an eye on things in the market, and if there is any opportunity for you to benefit from market changes, I'll be sure to reach out!\n\nWarm regards,\nReece`;
                          window.open(`mailto:${d.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`);
                        }
                        setDeals(p => p.map(dd => dd.id === d.id ? { ...dd, ...updates } : dd));
                        sb.upsert("deals", { id: d.id, ...updates });
                      }}
                        style={{ padding: "3px 6px", borderRadius: 4, border: `1px solid ${d.status === s ? STATUS_COLORS[s] : C.inputBorder}`, background: d.status === s ? `${STATUS_COLORS[s]}33` : "transparent", color: d.status === s ? STATUS_COLORS[s] : C.textDim, fontSize: 8, fontWeight: 600, cursor: "pointer", outline: "none" }}>{s}</button>
                    ))}
                  </div>
                  {/* Quick actions */}
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => {
                      u("name", d.name); u("state", d.state); u("leadId", d.leadId);
                      if (d.email) u("email", d.email); if (d.phone) u("phone", d.phone);
                      if (d.address) u("address", d.address); if (d.dob) u("dob", d.dob);
                      u("propVal", String(d.appraisedValue ? pn(d.appraisedValue) : d.propertyValue || ""));
                      if (d.currentBalance) u("curBal", String(d.currentBalance));
                      if (d.currentPL) u("curPL", String(d.currentPL));
                      const linked = leads.find(l => l.custId === d.leadId || l.leadId === d.leadId);
                      if (linked) {
                        if (linked.origMortgageDate) u("origClose", linked.origMortgageDate);
                        if (linked.interestRate) u("interestRate", linked.interestRate);
                        if (pn(linked.maxClaim) > 0) { u("origMCA", String(pn(linked.maxClaim))); u("origIMIP", String(Math.round(calcMIP(linked.maxClaim)))); }
                      }
                      setView("calculator");
                    }} style={{ flex: 1, padding: "5px 8px", borderRadius: 5, border: `1px solid ${C.accent}33`, background: "transparent", color: C.accent, fontSize: 9, fontWeight: 600, cursor: "pointer" }}>🔄 Re-run Pricing</button>
                    <button onClick={() => {
                      const text = prompt(`Create task for ${d.name}:`);
                      if (text && text.trim()) {
                        const task = { id: Date.now(), text: `[${d.name}] ${text.trim()}`, done: false, createdAt: new Date().toLocaleDateString() };
                        setTasks(prev => [task, ...prev]);
                        sb.upsert("tasks", { id: task.id, text: task.text, done: false, created_at: task.createdAt });
                      }
                    }} style={{ flex: 1, padding: "5px 8px", borderRadius: 5, border: `1px solid ${C.blue}33`, background: "transparent", color: C.blue, fontSize: 9, fontWeight: 600, cursor: "pointer" }}>📋 Create Task</button>
                  </div>
                </Card>
              ))}
            </>);
          })()}
        </>)}

        {/* DEAL DETAIL */}
        {view === "pipeline" && editingDeal && (() => {
          const d = deals.find(dd => dd.id === editingDeal); if (!d) return null;
          const pc = d.pipelineChecks || {};
          const togglePC = (key) => {
            const newChecks = { ...pc, [key]: !pc[key] };
            // Streamlined FA logic: if clicked, mark all income items
            if (key === "streamlinedFA" && !pc[key]) {
              newChecks.awardsLetter = true;
              newChecks["1099"] = true;
              newChecks.incomeVerification = true;
            }
            // Auto-mark income if both subs done
            if ((key === "awardsLetter" || key === "1099") && newChecks.awardsLetter && newChecks["1099"]) {
              newChecks.incomeVerification = true;
            }
            setDeals(p => p.map(dd => dd.id === d.id ? { ...dd, pipelineChecks: newChecks } : dd));
            sb.upsert("deals", { id: d.id, pipeline_checks: JSON.stringify(newChecks) });
          };
          const updateDealField = (key, val) => {
            setDeals(p => p.map(dd => dd.id === d.id ? { ...dd, [key]: val } : dd));
            // Map camelCase to snake_case for common fields
            const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
            sb.upsert("deals", { id: d.id, [dbKey]: val });
          };
          const CheckItem = ({ k, label, sub, indent }) => (
            <div onClick={() => togglePC(k)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", paddingLeft: indent ? 20 : 0, borderBottom: `1px solid ${C.divider}`, cursor: "pointer" }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${pc[k] ? C.accent : C.inputBorder}`, background: pc[k] ? C.accentDim : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: C.accent, flexShrink: 0 }}>{pc[k] ? "✓" : ""}</div>
              <div style={{ fontSize: 10, color: pc[k] ? C.textDim : C.text, textDecoration: pc[k] ? "line-through" : "none" }}>{label}</div>
              {sub && <span style={{ fontSize: 8, color: C.textDim, marginLeft: "auto" }}>{sub}</span>}
            </div>
          );
          // Countdown for Sent to Lender
          const stlHours = d.sentToLenderAt ? Math.max(0, 36 - ((Date.now() - d.sentToLenderAt) / 3600000)) : null;

          return (<>
            <Btn onClick={() => setEditingDeal(null)} small style={{ marginBottom: 12 }}>← Back</Btn>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: "'Playfair Display',serif" }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: C.textDim }}>ID: {d.leadId} · {d.state} · {d.createdAt} · {d.productLabel}</div>
                  {d.email && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>📧 {d.email}</div>}
                  {d.phone && <div style={{ fontSize: 10, color: C.textMuted }}>📞 {d.phone}</div>}
                  {d.address && <div style={{ fontSize: 10, color: C.textMuted }}>📍 {d.address}</div>}
                </div>
                <Badge color={STATUS_COLORS[d.status]} bg={`${STATUS_COLORS[d.status]}22`}>{d.status}</Badge>
              </div>
              <Hdr>Update Status</Hdr>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {STATUSES.map(s => (
                  <button key={s} onClick={() => {
                    const updates = { status: s };
                    if (s === "Sent to Lender" && !d.sentToLenderAt) updates.sentToLenderAt = Date.now();
                    if (s === "Submit CTC") { setShowConfetti(1); setTimeout(() => setShowConfetti(0), 4000); }
                    if (s === "CTC") { setShowConfetti(2); setTimeout(() => setShowConfetti(0), 5000); }
                    if (s === "Funded" && d.email) {
                      const subj = `Great News — Your Loan Has Funded!`;
                      const body = `Dear ${d.name.split(" ")[0]},\n\nGreat news! Everything has been funded without issue.\n\nYou should expect information in the coming weeks regarding the servicing of your loan. If you have any questions at all, please don't hesitate to reach out to me.\n\nI'll certainly keep an eye on things in the market, and if there is any opportunity for you to benefit from market changes, I'll be sure to reach out!\n\nWarm regards,\nReece`;
                      window.open(`mailto:${d.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`);
                    }
                    setDeals(p => p.map(dd => dd.id === d.id ? { ...dd, ...updates } : dd));
                    sb.upsert("deals", { id: d.id, ...updates });
                  }}
                    style={{ padding: "7px 10px", borderRadius: 7, border: `1px solid ${d.status === s ? STATUS_COLORS[s] : C.inputBorder}`, background: d.status === s ? `${STATUS_COLORS[s]}33` : "transparent", color: d.status === s ? STATUS_COLORS[s] : C.textDim, fontSize: 10, fontWeight: 600, cursor: "pointer", outline: "none" }}>{s}</button>
                ))}
              </div>
              <Hdr>Details</Hdr>
              <Row label="Lender" value={LENDERS[d.lender]?.name || d.lender} border />
              <Row label="Product" value={d.productLabel} border />
              <Row label={d.rateType?.includes("fixed") ? "Rate" : "Margin"} value={`${d.margin}%`} border />
              <Row label="Property Value" value={fmt(d.propertyValue)} border />
              <Row label="Current Balance" value={fmt(d.currentBalance)} border />
              <Row label="New PL" value={fmt(d.newPL)} color={C.accent} border />
              <Row label="Net to Borrower" value={fmt(d.netAvailable)} color={C.gold} bold border />
              <Row label="Broker Income" value={fmt(d.brokerIncome)} color={C.accent} bold />
              <button onClick={() => {
                u("name", d.name); u("state", d.state); u("leadId", d.leadId);
                if (d.email) u("email", d.email);
                if (d.phone) u("phone", d.phone);
                if (d.address) u("address", d.address);
                if (d.dob) u("dob", d.dob);
                // Use appraised value if available, otherwise property value
                u("propVal", String(d.appraisedValue ? pn(d.appraisedValue) : d.propertyValue || ""));
                if (d.currentBalance) u("curBal", String(d.currentBalance));
                if (d.currentPL) u("curPL", String(d.currentPL));
                if (d.newMCA) u("origMCA", String(d.newMCA));
                // Load from linked lead if available
                const linked = leads.find(l => l.custId === d.leadId || l.leadId === d.leadId);
                if (linked) {
                  if (linked.origMortgageDate) u("origClose", linked.origMortgageDate);
                  if (linked.interestRate) u("interestRate", linked.interestRate);
                  if (pn(linked.maxClaim) > 0) {
                    u("origMCA", String(pn(linked.maxClaim)));
                    u("origIMIP", String(Math.round(calcMIP(linked.maxClaim))));
                  }
                }
                setEditingDeal(null); setView("calculator");
              }} style={{ width: "100%", marginTop: 10, padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.accent}44`, background: C.accentDim, color: C.accent, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                🔄 Re-run Pricing{d.appraisedValue ? ` (Appraised: ${fmt(pn(d.appraisedValue))})` : ""}
              </button>
            </Card>

            {/* ── STATUS-SPECIFIC WORKFLOW ── */}

            {/* PITCHED */}
            {d.status === "Pitched" && (
              <Card style={{ borderColor: `${STATUS_COLORS["Pitched"]}33` }}>
                <Hdr>📋 Pitched — Checklist</Hdr>
                <CheckItem k="pitched" label="Pitched to borrower" />
                <CheckItem k="providedCounseling" label="Provided counseling info" />
                <CheckItem k="preHudRequested" label="PreHUD requested" />
                <div style={{ marginTop: 10 }}>
                  <Inp small id="fuDate" label="Follow-Up Date" type="date" value={d.followUpDate || ""} onChange={e => updateDealField("followUpDate", e.target.value)} />
                </div>
              </Card>
            )}

            {/* CC */}
            {d.status === "CC" && (
              <Card style={{ borderColor: `${STATUS_COLORS["CC"]}33` }}>
                <Hdr>📋 Counseling — Checklist</Hdr>
                <CheckItem k="pitched" label="Pitched to borrower" />
                <CheckItem k="providedCounseling" label="Provided counseling info" />
                <CheckItem k="preHudRequested" label="PreHUD requested" />
                <CheckItem k="proposalToCC" label="Proposal sent to counselor" />
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <Inp small id="ccDate" label="Counseling Date" type="date" value={d.counselingDate || ""} onChange={e => updateDealField("counselingDate", e.target.value)} />
                    <Inp small id="ccTime" label="Counseling Time" type="time" value={d.counselingTime || ""} onChange={e => updateDealField("counselingTime", e.target.value)} />
                  </div>
                  <Inp small id="fuDate2" label="Follow-Up Date" type="date" value={d.followUpDate || ""} onChange={e => updateDealField("followUpDate", e.target.value)} />
                  {d.counselingDate && new Date(d.counselingDate + "T" + (d.counselingTime || "23:59")) < new Date() && (
                    <div style={{ marginTop: 8, padding: 8, borderRadius: 6, background: C.dangerDim, border: `1px solid ${C.danger}33` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.danger }}>⏰ Counseling date has passed!</div>
                      <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>Get counseling certificate · Get documents sent out</div>
                      <button onClick={() => {
                        const t1 = { id: Date.now(), text: `[${d.name}] Get counseling certificate`, done: false, createdAt: new Date().toLocaleDateString() };
                        const t2 = { id: Date.now()+1, text: `[${d.name}] Get documents sent out`, done: false, createdAt: new Date().toLocaleDateString() };
                        setTasks(prev => [t1, t2, ...prev]);
                        sb.upsert("tasks", { id: t1.id, text: t1.text, done: false, created_at: t1.createdAt });
                        sb.upsert("tasks", { id: t2.id, text: t2.text, done: false, created_at: t2.createdAt });
                      }} style={{ marginTop: 6, padding: "5px 10px", borderRadius: 5, border: `1px solid ${C.danger}55`, background: "transparent", color: C.danger, fontSize: 9, fontWeight: 600, cursor: "pointer" }}>📋 Create Tasks on Dashboard</button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* DOCS OUT */}
            {d.status === "Docs Out" && (
              <Card style={{ borderColor: `${STATUS_COLORS["Docs Out"]}33` }}>
                <Hdr>📄 Docs Out — Document Checklist</Hdr>
                <CheckItem k="appSigned" label="Application Signed" />
                <CheckItem k="govId" label="Government ID" />
                <CheckItem k="mortgageStmt" label="Most Recent Mortgage Statement" />
                <CheckItem k="mortgageStmt2nd" label="Need 2nd Page" indent />
                <CheckItem k="insuranceDec" label="Homeowner's Insurance Declarations Page" />
                <CheckItem k="agentInfoCheck" label="Agent Info" indent sub={d.agentInfo || ""} />
                {!pc.agentInfoCheck && (
                  <div style={{ paddingLeft: 20, marginBottom: 4 }}>
                    <input value={d.agentInfo || ""} onChange={e => updateDealField("agentInfo", e.target.value)} placeholder="Insurance agent name/info..."
                      style={{ width: "100%", padding: "6px 8px", background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 5, color: C.text, fontSize: 10, fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
                  </div>
                )}
                <CheckItem k="incomeVerification" label="Income Verification" sub={pc.awardsLetter && pc["1099"] ? "✓ Complete" : ""} />
                <CheckItem k="awardsLetter" label="Awards Letter" indent />
                <CheckItem k="1099" label="1099" indent />
                <div style={{ borderTop: `1px solid ${C.divider}`, marginTop: 4 }} />
                <CheckItem k="streamlinedFA" label="✨ Streamlined Financial Assessment (marks all above)" />
                <Inp small id="fuDate3" label="Follow-Up Date" type="date" value={d.followUpDate || ""} onChange={e => updateDealField("followUpDate", e.target.value)} />
              </Card>
            )}

            {/* APPRAISAL ORDERED */}
            {d.status === "Appraisal Ordered" && (
              <Card style={{ borderColor: `${STATUS_COLORS["Appraisal Ordered"]}33` }}>
                <Hdr>🏠 Appraisal</Hdr>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <Inp small id="appInsp" label="Inspection Date" type="date" value={d.appraisalInspDate || ""} onChange={e => updateDealField("appraisalInspDate", e.target.value)} />
                  <Inp small id="appRpt" label="Expected Report Date" type="date" value={d.appraisalReportDate || ""} onChange={e => updateDealField("appraisalReportDate", e.target.value)} />
                </div>
                <Inp small id="appVal" label="Appraised Value" value={d.appraisedValue || ""} onChange={e => updateDealField("appraisedValue", e.target.value)} prefix="$" />
              </Card>
            )}

            {/* SENT TO LENDER */}
            {d.status === "Sent to Lender" && (
              <Card style={{ borderColor: `${STATUS_COLORS["Sent to Lender"]}33` }}>
                <Hdr>📤 Sent to Lender</Hdr>
                <div style={{ padding: 8, borderRadius: 6, background: C.input, marginBottom: 8, border: `1px solid ${C.divider}` }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.warning }}>⏱ Follow-up Countdown</div>
                  {stlHours !== null ? (
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: stlHours > 0 ? C.warning : C.danger }}>{stlHours > 0 ? `${Math.floor(stlHours)}h ${Math.round((stlHours % 1) * 60)}m remaining` : "⚠️ 36 hours elapsed — follow up now!"}</div>
                  ) : (
                    <div style={{ fontSize: 10, color: C.textDim }}>Timer starts when moved to this status</div>
                  )}
                </div>
                <CheckItem k="hoaInfo" label="HOA Info collected" />
                <CheckItem k="remainingItems" label="All remaining items submitted" />
                <Inp small id="fuDate4" label="Follow-Up Date" type="date" value={d.followUpDate || ""} onChange={e => updateDealField("followUpDate", e.target.value)} />
              </Card>
            )}

            {/* APPROVED */}
            {d.status === "Approved" && (
              <Card style={{ borderColor: `${STATUS_COLORS["Approved"]}33` }}>
                <Hdr>✅ Approved — Stipulations</Hdr>
                <div style={{ marginBottom: 8 }}>
                  {(d.stips || []).map((stip, si) => (
                    <div key={si} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: `1px solid ${C.divider}` }}>
                      <div onClick={() => {
                        const newStips = [...(d.stips || [])];
                        newStips[si] = { ...newStips[si], done: !newStips[si].done };
                        updateDealField("stips", newStips);
                      }} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${stip.done ? C.accent : C.inputBorder}`, background: stip.done ? C.accentDim : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: C.accent, cursor: "pointer", flexShrink: 0 }}>{stip.done ? "✓" : ""}</div>
                      <div style={{ flex: 1, fontSize: 10, color: stip.done ? C.textDim : C.text, textDecoration: stip.done ? "line-through" : "none" }}>{stip.text}</div>
                      {stip.borrowerItem && <span style={{ fontSize: 7, color: C.warning, fontWeight: 600, background: C.goldDim, padding: "1px 4px", borderRadius: 3 }}>Borrower</span>}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => {
                    const text = prompt("Add stipulation:");
                    if (text && text.trim()) {
                      const isBorrower = confirm("Is this a borrower item?");
                      updateDealField("stips", [...(d.stips || []), { text: text.trim(), done: false, borrowerItem: isBorrower }]);
                    }
                  }} style={{ flex: 1, padding: "6px 8px", borderRadius: 5, border: `1px solid ${C.accent}33`, background: C.accentDim, color: C.accent, fontSize: 9, fontWeight: 600, cursor: "pointer" }}>+ Add Stip</button>
                  {d.email && (d.stips || []).filter(s => s.borrowerItem && !s.done).length > 0 && (
                    <button onClick={() => {
                      const items = (d.stips || []).filter(s => s.borrowerItem && !s.done).map(s => `• ${s.text}`).join("\n");
                      const subj = `Action Needed — Items for Your Loan`;
                      const body = `Dear ${d.name.split(" ")[0]},\n\nWe're getting close! There are a few remaining items we need from you to keep things moving:\n\n${items}\n\nPlease gather these at your earliest convenience and let me know if you have any questions.\n\nBest regards,\nReece`;
                      window.open(`mailto:${d.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`);
                    }} style={{ flex: 1, padding: "6px 8px", borderRadius: 5, border: `1px solid ${C.warning}33`, background: C.goldDim, color: C.gold, fontSize: 9, fontWeight: 600, cursor: "pointer" }}>📧 Email Borrower Items</button>
                  )}
                </div>
              </Card>
            )}

            {/* CTC */}
            {d.status === "CTC" && (
              <Card style={{ borderColor: `${STATUS_COLORS["CTC"]}33` }}>
                <Hdr>🎉 Clear to Close</Hdr>
                <CheckItem k="hudApproved" label="HUD Approval Confirmed" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
                  <Inp small id="clDate" label="Closing Date & Time" type="datetime-local" value={d.closingDateTime || ""} onChange={e => updateDealField("closingDateTime", e.target.value)} />
                </div>
                <Inp small id="notName" label="Notary Name" value={d.notaryName || ""} onChange={e => updateDealField("notaryName", e.target.value)} />
                <Inp small id="notContact" label="Notary Contact" value={d.notaryContact || ""} onChange={e => updateDealField("notaryContact", e.target.value)} placeholder="Phone or email" />
                {d.email && d.closingDateTime && (
                  <button onClick={() => {
                    const clDate = new Date(d.closingDateTime);
                    const dateStr = clDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
                    const timeStr = clDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                    const subj = `Your Closing is Scheduled — ${dateStr}`;
                    const body = `Dear ${d.name.split(" ")[0]},\n\nGreat news — we're clear to close! Your closing has been scheduled for:\n\n📅 ${dateStr} at ${timeStr}\n${d.notaryName ? `\nYour notary will be: ${d.notaryName}${d.notaryContact ? ` (${d.notaryContact})` : ""}` : ""}\n\nImportant Information:\n• After signing, there is a 3-day right of rescission period where all documents will be sent back and reviewed.\n• During this time, no news is good news — the loan will fund on the 4th business day.\n• If there is anything needed, either myself or someone from the title company will reach out to discuss it.\n• Any money expected at funding will either be sent via overnight check or directly deposited if a voided check is provided at closing.\n\nPlease don't hesitate to reach out if you have any questions before your closing date.\n\nBest regards,\nReece`;
                    window.open(`mailto:${d.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`);
                  }} style={{ width: "100%", marginTop: 8, padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.accent}33`, background: C.accentDim, color: C.accent, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>📧 Send Closing Email to {d.name.split(" ")[0]}</button>
                )}
              </Card>
            )}

            {/* Quick create task */}
            <Card>
              <Hdr>📋 Quick Task</Hdr>
              <button onClick={() => {
                const text = prompt(`Create task for ${d.name}:`);
                if (text && text.trim()) {
                  const task = { id: Date.now(), text: `[${d.name}] ${text.trim()}`, done: false, createdAt: new Date().toLocaleDateString() };
                  setTasks(prev => [task, ...prev]);
                  sb.upsert("tasks", { id: task.id, text: task.text, done: false, created_at: task.createdAt });
                }
              }} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.blue}33`, background: C.blueDim, color: C.blue, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>+ Create Task → Dashboard</button>
              {d.followUpDate && (
                <div style={{ marginTop: 6, padding: 6, borderRadius: 5, background: C.input, fontSize: 10, color: C.textDim }}>
                  📅 Follow-up: {new Date(d.followUpDate + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {new Date(d.followUpDate) < new Date() && <span style={{ color: C.danger, fontWeight: 600 }}> — OVERDUE</span>}
                </div>
              )}
            </Card>

            {/* Activity Log */}
            <Card>
              <Hdr>📝 Activity Notes</Hdr>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Log a note..." onKeyDown={e => { if (e.key === "Enter") { addActivity(d.id, newNote); setNewNote(""); } }}
                  style={{ flex: 1, padding: "8px 10px", background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 7, color: C.text, fontSize: 11, fontFamily: "'DM Sans',sans-serif", outline: "none" }}
                  onFocus={e => { e.target.style.borderColor = C.inputFocus; }} onBlur={e => { e.target.style.borderColor = C.inputBorder; }} />
                <Btn primary small onClick={() => { addActivity(d.id, newNote); setNewNote(""); }}>+</Btn>
              </div>
              {activityLog.filter(a => a.dealId === d.id).length === 0 ? (
                <div style={{ fontSize: 10, color: C.textDim, textAlign: "center", padding: 6 }}>No notes yet</div>
              ) : (
                activityLog.filter(a => a.dealId === d.id).map(a => (
                  <div key={a.id} style={{ padding: "6px 0", borderBottom: `1px solid ${C.divider}` }}>
                    <div style={{ fontSize: 11, color: C.text }}>{a.text}</div>
                    <div style={{ fontSize: 8, color: C.textDim, marginTop: 2 }}>{a.timestamp}</div>
                  </div>
                ))
              )}
            </Card>

            <Btn danger onClick={() => { setDeals(p => p.filter(dd => dd.id !== d.id)); setEditingDeal(null); }} style={{ width: "100%", marginTop: 4 }}>🗑 Delete Deal</Btn>
          </>);
        })()}

        {/* ═══════ ACTIVE DEALS ═══════ */}
        {view === "active" && (<>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 12px" }}>Active Deals</h2>
          {activeDeals.length === 0 ? (
            <Card><div style={{ textAlign: "center", padding: 24, color: C.textDim, fontSize: 12 }}>No active deals. Funded and Fallout deals are excluded from this view.</div></Card>
          ) : (
            <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.cardBorder}` }}>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "auto 2fr 0.7fr 1fr 1fr", background: C.input, padding: "8px 10px", gap: 6 }}>
                {["ID", "Name", "State", "Status", "Est. Income"].map(h => (
                  <div key={h} style={{ fontSize: 8, fontWeight: 600, textTransform: "uppercase", color: C.textDim }}>{h}</div>
                ))}
              </div>
              {activeDeals.map((d, i) => (
                <div key={d.id} onClick={() => { setView("pipeline"); setEditingDeal(d.id); }} style={{ display: "grid", gridTemplateColumns: "auto 2fr 0.7fr 1fr 1fr", padding: "10px 10px", gap: 6, borderBottom: i < activeDeals.length - 1 ? `1px solid ${C.divider}` : "none", cursor: "pointer", background: C.card, transition: "background 0.15s" }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.textDim }}>{d.leadId}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>{d.state}</div>
                  <div><Badge color={STATUS_COLORS[d.status]} bg={`${STATUS_COLORS[d.status]}22`}>{d.status}</Badge></div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 700, color: C.accent }}>{fmtShort(d.brokerIncome)}</div>
                </div>
              ))}
              {/* Totals */}
              <div style={{ display: "grid", gridTemplateColumns: "auto 2fr 0.7fr 1fr 1fr", padding: "10px 10px", gap: 6, background: C.accentDim, borderTop: `1px solid ${C.accent}44` }}>
                <div></div>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.accent }}>Total ({activeDeals.length} active)</div>
                <div></div>
                <div></div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 700, color: C.accent }}>{fmtShort(activeDeals.reduce((s, d) => s + d.brokerIncome, 0))}</div>
              </div>
            </div>
          )}
        </>)}

        {/* ═══════ LEADS ═══════ */}
        {view === "leads" && (<>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>All Leads <span style={{ fontSize: 12, fontWeight: 500, color: C.textDim }}>({leads.length})</span></h2>
            <div style={{ display: "flex", gap: 4 }}>
              {bulkSelectMode ? (<>
                <Btn small onClick={() => { setBulkSelected(new Set(leads.map(l => l.id))); }}>Select All</Btn>
                <Btn small danger onClick={() => {
                  if (bulkSelected.size === 0) return;
                  if (!window.confirm(`Delete ${bulkSelected.size} selected leads?`)) return;
                  const ids = [...bulkSelected];
                  setLeads(p => p.filter(l => !bulkSelected.has(l.id)));
                  ids.forEach(id => sb.del("customers", { id }));
                  setBulkSelected(new Set()); setBulkSelectMode(false);
                }}>🗑 Delete ({bulkSelected.size})</Btn>
                <Btn small onClick={() => { setBulkSelectMode(false); setBulkSelected(new Set()); }}>Cancel</Btn>
              </>) : (<>
                <Btn small onClick={() => setBulkSelectMode(true)} style={{ color: C.danger, borderColor: `${C.danger}44` }}>☑ Select</Btn>
                <Btn small onClick={() => setDeleteAllStep(1)} style={{ color: C.danger, borderColor: `${C.danger}44` }}>🗑 Delete All</Btn>
                <Btn primary small onClick={() => setAddingLead(!addingLead)}>{addingLead ? "Cancel" : "+ Add Lead"}</Btn>
              </>)}
            </div>
          </div>

          {/* Delete All Confirmation */}
          {deleteAllStep > 0 && (
            <Card style={{ borderColor: `${C.danger}55`, marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.danger, marginBottom: 8 }}>⚠️ {deleteAllStep === 1 ? "Enter passcode to delete ALL leads" : "Enter passcode again to confirm"}</div>
              <div style={{ fontSize: 9, color: C.textDim, marginBottom: 8 }}>This will permanently delete all {leads.length} leads. This cannot be undone.</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input type="password" value={deleteAllPw} onChange={e => setDeleteAllPw(e.target.value)} placeholder={deleteAllStep === 1 ? "Enter passcode..." : "Confirm passcode..."}
                  style={{ flex: 1, padding: "8px 10px", background: C.input, border: `1px solid ${C.danger}44`, borderRadius: 6, color: C.text, fontSize: 12, fontFamily: "'DM Mono',monospace", outline: "none" }} />
                <Btn danger onClick={() => {
                  if (deleteAllPw !== "85233") { alert("Incorrect passcode"); setDeleteAllPw(""); return; }
                  if (deleteAllStep === 1) { setDeleteAllStep(2); setDeleteAllPw(""); return; }
                  // Second confirmation passed — delete all
                  leads.forEach(l => sb.del("customers", { id: l.id }));
                  setLeads([]);
                  setDeleteAllStep(0); setDeleteAllPw("");
                }}>
                  {deleteAllStep === 1 ? "Next →" : "🗑 DELETE ALL LEADS"}
                </Btn>
                <Btn small onClick={() => { setDeleteAllStep(0); setDeleteAllPw(""); }}>Cancel</Btn>
              </div>
            </Card>
          )}

          {/* Global Customer ID Search */}
          <Card style={{ borderColor: `${C.blue}33`, marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ fontSize: 16, flexShrink: 0 }}>🔍</div>
              <input
                value={globalSearch}
                onChange={e => { setGlobalSearch(e.target.value); searchByCustId(e.target.value); }}
                placeholder="Search by Customer ID, name, or address..."
                style={{ flex: 1, padding: "10px 12px", background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none" }}
                onFocus={e => { e.target.style.borderColor = C.inputFocus; }} onBlur={e => { e.target.style.borderColor = C.inputBorder; }}
              />
            </div>

            {/* Search Results */}
            {globalSearch.trim() && globalSearchResult && (<>
              {globalSearchResult.lead ? (
                <div style={{ marginTop: 12 }}>
                  {/* Lead Card */}
                  <div style={{ background: C.accentDim, borderRadius: 10, padding: 12, marginBottom: 8, border: `1px solid ${C.accent}33` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{globalSearchResult.lead.name}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.accent, fontWeight: 700, background: `${C.accent}15`, padding: "2px 8px", borderRadius: 5 }}>
                            {globalSearchResult.lead.custId}
                          </span>
                          {globalSearchResult.lead.leadId !== globalSearchResult.lead.custId && (
                            <span style={{ fontSize: 9, color: C.textDim, padding: "2px 6px", background: C.input, borderRadius: 4 }}>Lead: {globalSearchResult.lead.leadId}</span>
                          )}
                          <span style={{ fontSize: 9, color: C.textDim, padding: "2px 6px", background: C.input, borderRadius: 4 }}>{globalSearchResult.lead.state}</span>
                        </div>
                        <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>
                          {globalSearchResult.lead.phone && `📞 ${globalSearchResult.lead.phone} · `}
                          {globalSearchResult.lead.email && `📧 ${globalSearchResult.lead.email}`}
                        </div>
                        {globalSearchResult.lead.address && <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>📍 {globalSearchResult.lead.address}</div>}
                        {globalSearchResult.lead.source && <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2 }}>Source: {globalSearchResult.lead.source}</div>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 9, color: C.textDim }}>{globalSearchResult.lead.createdAt}</div>
                        {globalSearchResult.lead.converted && <Badge color={C.accent} bg={C.accentDim}>Converted</Badge>}
                      </div>
                    </div>
                  </div>

                  {/* Original Mortgage & MIP */}
                  {(globalSearchResult.lead.origMortgageDate || pn(globalSearchResult.lead.maxClaim) > 0) && (
                    <div style={{ background: "#0a0f1a", border: `1px solid ${C.divider}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                      <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", color: C.textDim, marginBottom: 6 }}>Original Reverse Mortgage</div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {globalSearchResult.lead.origMortgageDate && (
                          <div>
                            <div style={{ fontSize: 8, color: C.textDim }}>Orig. Date</div>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 600, color: C.text }}>{new Date(globalSearchResult.lead.origMortgageDate + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                            {(() => { const od = new Date(globalSearchResult.lead.origMortgageDate), now = new Date(); const mos = (now.getFullYear() - od.getFullYear()) * 12 + (now.getMonth() - od.getMonth()); return <div style={{ fontSize: 8, color: mos >= 18 ? C.pass : C.fail, fontWeight: 600 }}>{mos}mo {mos >= 18 ? "✓ Seasoned" : "✗ Need 18+"}</div>; })()}
                          </div>
                        )}
                        {pn(globalSearchResult.lead.maxClaim) > 0 && (
                          <div>
                            <div style={{ fontSize: 8, color: C.textDim }}>Max Claim</div>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 600, color: C.text }}>{fmt(pn(globalSearchResult.lead.maxClaim))}</div>
                          </div>
                        )}
                        {pn(globalSearchResult.lead.maxClaim) > 0 && (
                          <div style={{ background: C.accentDim, borderRadius: 6, padding: "4px 10px" }}>
                            <div style={{ fontSize: 8, color: C.accent, fontWeight: 600 }}>Est. Original MIP</div>
                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 700, color: C.accent }}>{fmt(globalSearchResult.lead.mipAmount || calcMIP(globalSearchResult.lead.maxClaim))}</div>
                            <div style={{ fontSize: 7, color: C.textDim }}>{fmt(pn(globalSearchResult.lead.maxClaim))} ÷ 1.5 × 2%</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Associated Campaigns */}
                  {globalSearchResult.campaigns.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", color: C.purple, marginBottom: 4 }}>📬 Marketing Campaigns ({globalSearchResult.campaigns.length})</div>
                      {globalSearchResult.campaigns.map(camp => (
                        <div key={camp.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: C.purpleDim, borderRadius: 6, marginBottom: 3, fontSize: 10 }}>
                          <span style={{ color: C.text, fontWeight: 600 }}>{camp.name}</span>
                          <span style={{ color: C.textDim }}>{camp.date || camp.createdAt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Associated Mailings */}
                  {globalSearchResult.mailings.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", color: C.blue, marginBottom: 4 }}>✉️ Mail History ({globalSearchResult.mailings.length} pieces)</div>
                      {globalSearchResult.mailings.slice(0, 5).map((m, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 10px", background: C.blueDim, borderRadius: 6, marginBottom: 2, fontSize: 9 }}>
                          <span style={{ color: C.text }}>{m.stampType} · {m.envelopeType}</span>
                          <span style={{ color: C.textDim }}>{m.dateSent || "—"}{m.cost ? ` · ${fmt(pn(m.cost))}` : ""}</span>
                        </div>
                      ))}
                      {globalSearchResult.mailings.length > 5 && <div style={{ fontSize: 8, color: C.textDim, textAlign: "center", marginTop: 2 }}>+{globalSearchResult.mailings.length - 5} more</div>}
                    </div>
                  )}

                  {/* Associated Deals */}
                  {globalSearchResult.deals.length > 0 && (
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", color: C.gold, marginBottom: 4 }}>💰 Deals ({globalSearchResult.deals.length})</div>
                      {globalSearchResult.deals.map(d => (
                        <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: C.goldDim, borderRadius: 6, marginBottom: 3 }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: C.text }}>{d.productLabel} · {d.lender}</div>
                            <div style={{ fontSize: 8, color: C.textDim }}>{d.status} · {d.createdAt}</div>
                          </div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 700, color: C.gold }}>{fmt(d.brokerIncome)}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {globalSearchResult.deals.length === 0 && globalSearchResult.campaigns.length === 0 && (
                    <div style={{ fontSize: 10, color: C.textDim, textAlign: "center", padding: 8 }}>No deals or campaigns associated yet.</div>
                  )}

                  {/* Quick actions */}
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <Btn small primary onClick={() => {
                      const gl = globalSearchResult.lead;
                      u("name", gl.name); u("state", gl.state); u("leadId", gl.custId);
                      if (gl.email) u("email", gl.email);
                      if (gl.phone) u("phone", gl.phone);
                      if (gl.address) u("address", gl.address);
                      if (gl.dob) u("dob", gl.dob);
                      if (gl.interestRate) u("interestRate", gl.interestRate);
                      if (gl.origMortgageDate) u("origClose", gl.origMortgageDate);
                      if (pn(gl.maxClaim) > 0) {
                        u("origMCA", String(pn(gl.maxClaim)));
                        u("origIMIP", String(Math.round(calcMIP(gl.maxClaim))));
                      }
                      setView("calculator"); setGlobalSearch(""); setGlobalSearchResult(null);
                    }}>📊 Run Pricing</Btn>
                    <Btn small onClick={() => { setMktLeadId(globalSearchResult.lead.id); setView("marketing"); setMktView("lead_detail"); setGlobalSearch(""); setGlobalSearchResult(null); }}>📬 View in Marketing</Btn>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 12, textAlign: "center", padding: 16, fontSize: 12, color: C.textDim }}>No customer found matching "{globalSearch}"</div>
              )}
            </>)}
          </Card>

          {addingLead && (
            <Card>
              <Hdr>New Lead</Hdr>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <Inp small id="nlcid" label="Customer ID" value={nl.custId} onChange={e => snl(p => ({ ...p, custId: e.target.value }))} placeholder={nextCustId(nl.maxClaim, nl.origMortgageDate)} hint={getLLCode(nl.maxClaim, nl.origMortgageDate) ? `Auto: ${getLLCode(nl.maxClaim, nl.origMortgageDate)} (${pn(nl.maxClaim) > 1815000 && !LL_CODES[String(Math.round(pn(nl.maxClaim)))] ? "proprietary" : "loan limit year"})` : "Auto-generates if blank"} />
                <Inp small id="nlid" label="Lead ID (optional)" value={nl.leadId} onChange={e => snl(p => ({ ...p, leadId: e.target.value }))} placeholder="e.g. from mailer" hint="Defaults to Customer ID" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 6 }}>
                <Inp small id="ln" label="Name" value={nl.name} onChange={e => snl(p => ({ ...p, name: e.target.value }))} />
                <Sel id="ls" label="State" value={nl.state} onChange={e => snl(p => ({ ...p, state: e.target.value }))} options={US_STATES.map(s => ({ v: s, l: s }))} />
              </div>
              <Inp small id="laddr" label="Property Address" value={nl.address} onChange={e => snl(p => ({ ...p, address: e.target.value }))} placeholder="123 Main St, Phoenix, AZ 85001" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <Inp small id="ldob" label="DOB (Youngest)" type="date" value={nl.dob} onChange={e => snl(p => ({ ...p, dob: e.target.value }))} />
                <Inp small id="lp" label="Phone" value={nl.phone} onChange={e => snl(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <Inp small id="le" label="Email" value={nl.email} onChange={e => snl(p => ({ ...p, email: e.target.value }))} />

              {/* Original Mortgage Info */}
              <div style={{ background: C.input, borderRadius: 8, padding: 10, marginTop: 6, marginBottom: 6, border: `1px solid ${C.divider}` }}>
                <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", color: C.textDim, marginBottom: 8, letterSpacing: "0.06em" }}>Original Reverse Mortgage</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <Inp small id="lomd" label="Original Mortgage Date" type="date" value={nl.origMortgageDate} onChange={e => snl(p => ({ ...p, origMortgageDate: e.target.value }))} />
                  <Inp small id="lmc" label="Max Claim Amount" value={nl.maxClaim} onChange={e => snl(p => ({ ...p, maxClaim: e.target.value }))} prefix="$" placeholder="e.g. 450000" />
                </div>
                <Inp small id="lir" label="Current Interest Rate" value={nl.interestRate} onChange={e => snl(p => ({ ...p, interestRate: e.target.value }))} placeholder="e.g. 6.250" hint="Current note rate on existing HECM" />
                {pn(nl.maxClaim) > 0 && (
                  <div style={{ background: C.accentDim, borderRadius: 6, padding: "8px 10px", marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 8, fontWeight: 600, textTransform: "uppercase", color: C.accent }}>Estimated Original MIP</div>
                      <div style={{ fontSize: 8, color: C.textDim, marginTop: 1 }}>{fmt(pn(nl.maxClaim))} ÷ 1.5 × 2%</div>
                    </div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: C.accent }}>{fmt(calcMIP(nl.maxClaim))}</div>
                  </div>
                )}
              </div>

              <Inp small id="lsc" label="Source" value={nl.source} onChange={e => snl(p => ({ ...p, source: e.target.value }))} hint="Referral, Mailer, Web, etc." />
              <Inp small id="lno" label="Notes" value={nl.notes} onChange={e => snl(p => ({ ...p, notes: e.target.value }))} />
              <Btn primary onClick={saveLead} style={{ width: "100%", marginTop: 2 }}>Save Lead</Btn>
            </Card>
          )}
          {leads.length === 0 && !addingLead ? (
            <Card><div style={{ textAlign: "center", padding: 24, color: C.textDim, fontSize: 12 }}>No leads yet. Click "+ Add Lead" to start.</div></Card>
          ) : (leads.map(l => (
            <Card key={l.id}>
              {editingLeadId === l.id ? (<>
                {/* ── EDIT MODE ── */}
                <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 8 }}>✏️ Editing — {l.custId || l.leadId}</div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 6 }}>
                  <Inp small id="en" label="Name" value={editData.name} onChange={e => ed("name", e.target.value)} />
                  <Sel id="es" label="State" value={editData.state} onChange={e => ed("state", e.target.value)} options={US_STATES.map(s => ({ v: s, l: s }))} />
                </div>
                <Inp small id="eaddr" label="Address" value={editData.address} onChange={e => ed("address", e.target.value)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <Inp small id="ephone" label="Phone" value={editData.phone} onChange={e => ed("phone", e.target.value)} />
                  <Inp small id="eemail" label="Email" value={editData.email} onChange={e => ed("email", e.target.value)} />
                </div>
                <Inp small id="edob" label="DOB" type="date" value={editData.dob} onChange={e => ed("dob", e.target.value)} />
                <div style={{ background: C.input, borderRadius: 8, padding: 10, marginTop: 6, marginBottom: 6, border: `1px solid ${C.divider}` }}>
                  <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", color: C.textDim, marginBottom: 6 }}>Original Reverse Mortgage</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <Inp small id="eomd" label="Orig. Mortgage Date" type="date" value={editData.origMortgageDate} onChange={e => ed("origMortgageDate", e.target.value)} />
                    <Inp small id="emc" label="Max Claim" value={editData.maxClaim} onChange={e => ed("maxClaim", e.target.value)} prefix="$" />
                  </div>
                  <Inp small id="eir" label="Current Interest Rate" value={editData.interestRate} onChange={e => ed("interestRate", e.target.value)} placeholder="e.g. 6.250" />
                  {pn(editData.maxClaim) > 0 && (
                    <div style={{ background: C.accentDim, borderRadius: 6, padding: "6px 10px", marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 8, color: C.accent, fontWeight: 600 }}>Est. MIP: {fmt(pn(editData.maxClaim))} ÷ 1.5 × 2%</div>
                        {getLLCode(editData.maxClaim, editData.origMortgageDate) && <div style={{ fontSize: 7, color: C.blue, fontWeight: 600 }}>{getLLCode(editData.maxClaim, editData.origMortgageDate)} {pn(editData.maxClaim) > 1815000 && !LL_CODES[String(Math.round(pn(editData.maxClaim)))] ? "Proprietary" : "Loan Limit"}</div>}
                      </div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 700, color: C.accent }}>{fmt(calcMIP(editData.maxClaim))}</div>
                    </div>
                  )}
                </div>
                <Inp small id="esrc" label="Source" value={editData.source} onChange={e => ed("source", e.target.value)} />
                <Inp small id="enotes" label="Notes" value={editData.notes} onChange={e => ed("notes", e.target.value)} />
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <Btn primary onClick={saveEditLead} style={{ flex: 1 }}>💾 Save Changes</Btn>
                  <Btn onClick={() => setEditingLeadId(null)} style={{ flex: 1 }}>Cancel</Btn>
                </div>
              </>) : (<>
                {/* ── VIEW MODE ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    {bulkSelectMode && (
                      <div onClick={(e) => { e.stopPropagation(); setBulkSelected(prev => { const n = new Set(prev); if (n.has(l.id)) n.delete(l.id); else n.add(l.id); return n; }); }}
                        style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${bulkSelected.has(l.id) ? C.danger : C.inputBorder}`, background: bulkSelected.has(l.id) ? C.dangerDim : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.danger, cursor: "pointer", flexShrink: 0, marginTop: 2 }}>{bulkSelected.has(l.id) ? "✓" : ""}</div>
                    )}
                    <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{l.name}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.accent, fontWeight: 700, background: C.accentDim, padding: "1px 6px", borderRadius: 4 }}>{l.custId || l.leadId}</span>
                      {l.leadId && l.leadId !== l.custId && <span style={{ fontSize: 9, color: C.textDim }}>Lead: {l.leadId}</span>}
                      <span style={{ fontSize: 9, color: C.textDim }}>{l.state}</span>
                    </div>
                    <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{l.phone ? `${l.phone} · ` : ""}{l.email || ""}</div>
                    {l.address && <div style={{ fontSize: 9, color: C.textDim, marginTop: 1 }}>📍 {l.address}</div>}
                    {l.source && <div style={{ fontSize: 9, color: C.textDim, marginTop: 1 }}>Source: {l.source}</div>}
                    {pn(l.maxClaim) > 0 && <div style={{ fontSize: 9, color: C.accent, marginTop: 1 }}>MIP: {fmt(l.mipAmount || calcMIP(l.maxClaim))} · MCA: {fmt(pn(l.maxClaim))}{getLLCode(l.maxClaim, l.origMortgageDate) ? ` · ${getLLCode(l.maxClaim, l.origMortgageDate)}` : ""}{l.interestRate ? ` · ${l.interestRate}%` : ""}</div>}
                    {!pn(l.maxClaim) && l.interestRate && <div style={{ fontSize: 9, color: C.blue, marginTop: 1 }}>Rate: {l.interestRate}%</div>}
                    {l.notes && <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3, fontStyle: "italic" }}>{l.notes}</div>}
                  </div>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ fontSize: 9, color: C.textDim }}>{l.createdAt}</div>
                    {campaigns.filter(camp => camp.leadIds.includes(l.id)).length > 0 && (
                      <div style={{ fontSize: 8, color: C.purple }}>📬 {campaigns.filter(camp => camp.leadIds.includes(l.id)).length} campaign{campaigns.filter(camp => camp.leadIds.includes(l.id)).length > 1 ? "s" : ""}</div>
                    )}
                    <button onClick={() => startEditLead(l)} style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid ${C.blue}44`, background: C.blueDim, color: C.blue, fontSize: 8, fontWeight: 600, cursor: "pointer" }}>✏️ Edit</button>
                    <button onClick={() => { setLeads(p => p.filter(ll => ll.id !== l.id)); sb.del("customers", { id: l.id }); }} style={{ padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.danger}33`, background: "transparent", color: C.danger, fontSize: 8, fontWeight: 600, cursor: "pointer" }}>Remove</button>
                  </div>
                </div>
              </>)}
            </Card>
          )))}

          {/* ── PRICING HISTORY ── */}
          {pricingHistory.length > 0 && (<>
            <div style={{ marginTop: 16, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: "'Playfair Display',serif" }}>📊 Pricing History ({pricingHistory.length})</div>
              <div style={{ display: "flex", gap: 3 }}>
                {[{k:"timestamp",l:"Recent"},{k:"bestComp",l:"💰 Comp"},{k:"bestNetFunds",l:"🏦 Net"},{k:"name",l:"A-Z"}].map(s => (
                  <button key={s.k} onClick={() => {
                    setPricingHistory(prev => [...prev].sort((a,b) => {
                      if (s.k === "name") return (a.name||"").localeCompare(b.name||"");
                      if (s.k === "timestamp") return b.id - a.id;
                      return (b[s.k] || 0) - (a[s.k] || 0);
                    }));
                  }} style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid ${C.inputBorder}`, background: "transparent", color: C.textDim, fontSize: 8, fontWeight: 600, cursor: "pointer" }}>{s.l}</button>
                ))}
              </div>
            </div>
            {pricingHistory.map(ph => (
              <Card key={ph.id} style={{ borderLeft: `3px solid ${C.blue}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{ph.name}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 2, flexWrap: "wrap", alignItems: "center" }}>
                      {ph.custId && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.accent, fontWeight: 700, background: C.accentDim, padding: "1px 5px", borderRadius: 3 }}>{ph.custId}</span>}
                      <span style={{ fontSize: 9, color: C.textDim }}>{ph.state}</span>
                      {ph.address && <span style={{ fontSize: 8, color: C.textDim }}>📍 {ph.address.length > 30 ? ph.address.substring(0,30) + "…" : ph.address}</span>}
                    </div>
                    <div style={{ fontSize: 9, color: C.textDim, marginTop: 3 }}>
                      Prop: {fmt(ph.propVal)} · Bal: {fmt(ph.curBal)} · {ph.resultsCount} products found
                    </div>
                    <div style={{ fontSize: 10, color: C.blue, fontWeight: 600, marginTop: 3 }}>
                      Best: {ph.bestProduct} · {fmt(ph.bestComp)} comp · {fmt(ph.bestNetFunds)} net
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 700, color: C.accent }}>{fmt(ph.bestComp)}</div>
                    <div style={{ fontSize: 8, color: C.textDim }}>{ph.timestamp}</div>
                    <button onClick={() => {
                      u("name", ph.name); u("state", ph.state); u("leadId", ph.custId || "");
                      if (ph.phone) u("phone", ph.phone);
                      if (ph.email) u("email", ph.email);
                      if (ph.address) u("address", ph.address);
                      if (ph.dob) u("dob", ph.dob);
                      u("propVal", String(ph.propVal)); u("curBal", String(ph.curBal));
                      setView("calculator");
                    }} style={{ marginTop: 4, padding: "3px 8px", borderRadius: 4, border: `1px solid ${C.accent}44`, background: C.accentDim, color: C.accent, fontSize: 8, fontWeight: 600, cursor: "pointer" }}>▶ Re-run</button>
                  </div>
                </div>
              </Card>
            ))}
          </>)}
        </>)}

        {/* ═══════ MARKETING ═══════ */}
        {view === "marketing" && (<>

          {/* ── CAMPAIGNS LIST ── */}
          {mktView === "campaigns" && (<>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>Marketing</h2>
              <Btn primary small onClick={() => setAddingCampaign(!addingCampaign)}>{addingCampaign ? "Cancel" : "+ New Campaign"}</Btn>
            </div>

            {addingCampaign && (
              <Card style={{ borderColor: `${C.purple}44` }}>
                <Hdr>New Campaign</Hdr>
                <Inp small id="cn" label="Campaign Name" value={newCamp.name} onChange={e => setNewCamp(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Feb 2026 AZ Mailer Drop" />
                <Inp small id="cd" label="Campaign Date" type="date" value={newCamp.date} onChange={e => setNewCamp(p => ({ ...p, date: e.target.value }))} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <Inp small id="cpp" label="Est. Cost per Piece ($)" value={newCamp.costPerPiece} onChange={e => setNewCamp(p => ({ ...p, costPerPiece: e.target.value }))} prefix="$" placeholder="1.25" />
                  <Inp small id="che" label="Total Hours Sending" value={newCamp.hoursEstimate} onChange={e => setNewCamp(p => ({ ...p, hoursEstimate: e.target.value }))} placeholder="e.g. 4.5" />
                </div>
                <Inp small id="cno" label="Notes" value={newCamp.notes} onChange={e => setNewCamp(p => ({ ...p, notes: e.target.value }))} placeholder="Target area, list source, budget, etc." />
                <Btn primary onClick={saveCampaign} style={{ width: "100%", marginTop: 4 }}>Create Campaign</Btn>
              </Card>
            )}

            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
              <div style={{ background: C.purpleDim, borderRadius: 8, padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 8, color: C.purple, fontWeight: 600, textTransform: "uppercase" }}>Letters Sent</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: C.purple }}>{globalTotalLetters}</div>
              </div>
              <div style={{ background: C.dangerDim, borderRadius: 8, padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 8, color: C.danger, fontWeight: 600, textTransform: "uppercase" }}>Total Cost</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: C.danger }}>{fmt(globalTotalCost)}</div>
              </div>
              <div style={{ background: C.blueDim, borderRadius: 8, padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 8, color: C.blue, fontWeight: 600, textTransform: "uppercase" }}>Total Hours</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: C.blue }}>{globalTotalHours.toFixed(1)}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
              <div style={{ background: C.accentDim, borderRadius: 8, padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 8, color: C.accent, fontWeight: 600, textTransform: "uppercase" }}>Converted</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: C.accent }}>{leads.filter(l => l.converted).length}</div>
              </div>
              <div style={{ background: C.goldDim, borderRadius: 8, padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 8, color: C.gold, fontWeight: 600, textTransform: "uppercase" }}>Funded Comp</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: C.gold }}>{fmtShort(globalFundedComp)}</div>
              </div>
              <div style={{ background: globalFundedComp > globalTotalCost ? C.accentDim : C.dangerDim, borderRadius: 8, padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 8, color: globalFundedComp > globalTotalCost ? C.accent : C.danger, fontWeight: 600, textTransform: "uppercase" }}>ROI</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: globalFundedComp > globalTotalCost ? C.accent : C.danger }}>{globalTotalCost > 0 ? `${((globalFundedComp - globalTotalCost) / globalTotalCost * 100).toFixed(0)}%` : "—"}</div>
              </div>
            </div>

            {campaigns.length === 0 && !addingCampaign ? (
              <Card><div style={{ textAlign: "center", padding: 24, color: C.textDim, fontSize: 12 }}>No campaigns yet. Create one to start tracking mail.</div></Card>
            ) : (
              campaigns.map(camp => {
                const cs = getCampStats(camp);
                return (
                  <Card key={camp.id} style={{ cursor: "pointer" }} >
                    <div onClick={() => { setActiveCampaignId(camp.id); setMktView("campaign_detail"); }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{camp.name}</div>
                          <div style={{ fontSize: 10, color: C.textDim, marginTop: 1 }}>{camp.date ? new Date(camp.date + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : camp.createdAt}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                        <Badge color={C.purple} bg={C.purpleDim}>{cs.totalLetters} letters</Badge>
                        <Badge color={C.blue} bg={C.blueDim}>{camp.leadIds.length} leads</Badge>
                        {cs.totalCost > 0 && <Badge color={C.danger} bg={C.dangerDim}>{fmt(cs.totalCost)}</Badge>}
                        {cs.totalHours > 0 && <Badge color={C.textMuted} bg={`${C.textDim}22`}>{cs.totalHours}h</Badge>}
                        {cs.convertedCount > 0 && <Badge color={C.accent} bg={C.accentDim}>{cs.convertedCount} conv</Badge>}
                        {cs.fundedComp > 0 && <Badge color={C.gold} bg={C.goldDim}>{fmtShort(cs.fundedComp)} funded</Badge>}
                      </div>
                      {camp.notes && <div style={{ fontSize: 9, color: C.textMuted, fontStyle: "italic" }}>{camp.notes}</div>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setCampaigns(p => p.filter(cc => cc.id !== camp.id)); sb.del("campaigns", { id: camp.id }); }} style={{ marginTop: 8, padding: "3px 8px", borderRadius: 4, border: `1px solid ${C.danger}33`, background: "transparent", color: C.danger, fontSize: 8, fontWeight: 600, cursor: "pointer" }}>Delete Campaign</button>
                  </Card>
                );
              })
            )}
          </>)}

          {/* ── CAMPAIGN DETAIL ── */}
          {mktView === "campaign_detail" && activeCampaign && (() => {
            const cs = getCampStats(activeCampaign);
            return (<>
            <Btn onClick={() => { setMktView("campaigns"); setActiveCampaignId(null); setMktSearch(""); }} small style={{ marginBottom: 12 }}>← Campaigns</Btn>
            <Card>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: "'Playfair Display',serif" }}>{activeCampaign.name}</div>
              <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{activeCampaign.date ? new Date(activeCampaign.date + "T00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : activeCampaign.createdAt}</div>
              {activeCampaign.notes && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4, fontStyle: "italic" }}>{activeCampaign.notes}</div>}
            </Card>

            {/* Campaign Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
              <div style={{ background: C.purpleDim, borderRadius: 8, padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 8, color: C.purple, fontWeight: 600, textTransform: "uppercase" }}>Letters</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: C.purple }}>{cs.totalLetters}</div>
              </div>
              <div style={{ background: C.dangerDim, borderRadius: 8, padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 8, color: C.danger, fontWeight: 600, textTransform: "uppercase" }}>Cost</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: C.danger }}>{fmt(cs.totalCost)}</div>
              </div>
              <div style={{ background: C.blueDim, borderRadius: 8, padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 8, color: C.blue, fontWeight: 600, textTransform: "uppercase" }}>Hours</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: C.blue }}>{cs.totalHours}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
              <div style={{ background: C.accentDim, borderRadius: 8, padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 8, color: C.accent, fontWeight: 600, textTransform: "uppercase" }}>Converted</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: C.accent }}>{cs.convertedCount}</div>
              </div>
              <div style={{ background: C.goldDim, borderRadius: 8, padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 8, color: C.gold, fontWeight: 600, textTransform: "uppercase" }}>Funded $</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: C.gold }}>{fmtShort(cs.fundedComp)}</div>
              </div>
              <div style={{ background: cs.roi > 0 ? C.accentDim : cs.totalCost > 0 ? C.dangerDim : `${C.textDim}11`, borderRadius: 8, padding: 8, textAlign: "center" }}>
                <div style={{ fontSize: 8, color: cs.roi > 0 ? C.accent : cs.totalCost > 0 ? C.danger : C.textDim, fontWeight: 600, textTransform: "uppercase" }}>ROI</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: cs.roi > 0 ? C.accent : cs.totalCost > 0 ? C.danger : C.textDim }}>{cs.totalCost > 0 ? `${cs.roi.toFixed(0)}%` : "—"}</div>
              </div>
            </div>

            {/* Funded deals from this campaign */}
            {cs.fundedDeals.length > 0 && (
              <Card style={{ borderColor: `${C.gold}44` }}>
                <Hdr>🏆 Funded Deals from Campaign</Hdr>
                {cs.fundedDeals.map(d => (
                  <div key={d.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.divider}` }}>
                    <div><div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{d.name}</div><div style={{ fontSize: 9, color: C.textDim }}>{d.leadId} · {d.productLabel}</div></div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 700, color: C.gold }}>{fmtShort(d.brokerIncome)}</div>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, padding: "6px 0" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.gold }}>Total Funded Comp</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 700, color: C.gold }}>{fmt(cs.fundedComp)}</div>
                </div>
              </Card>
            )}

            {/* Search + add leads */}
            <Hdr>Add Leads to Campaign</Hdr>
            <div style={{ marginBottom: 12 }}>
              <input value={mktSearch} onChange={e => setMktSearch(e.target.value)} placeholder="Search by name, ID, address, or state..."
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", background: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 7, color: C.text, fontSize: 12, fontFamily: "'DM Sans',sans-serif", outline: "none", marginBottom: 6 }}
                onFocus={e => { e.target.style.borderColor = C.inputFocus; }} onBlur={e => { e.target.style.borderColor = C.inputBorder; }} />
              {mktSearch.trim() && filteredLeads.length > 0 && (
                <div style={{ background: C.input, borderRadius: 8, border: `1px solid ${C.cardBorder}`, maxHeight: 180, overflow: "auto" }}>
                  {filteredLeads.filter(l => !activeCampaign.leadIds.includes(l.id)).map(l => (
                    <div key={l.id} onClick={() => { addLeadToCampaign(activeCampaign.id, l.id); setMktSearch(""); }} style={{ padding: "8px 10px", cursor: "pointer", borderBottom: `1px solid ${C.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{l.name}</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.accent, fontWeight: 600, marginLeft: 6, background: C.accentDim, padding: "1px 5px", borderRadius: 3 }}>{l.custId || l.leadId}</span>
                        <span style={{ fontSize: 9, color: C.textDim, marginLeft: 4 }}>{l.state}</span>
                      </div>
                      <span style={{ fontSize: 9, color: C.accent, fontWeight: 600 }}>+ Add</span>
                    </div>
                  ))}
                  {filteredLeads.filter(l => !activeCampaign.leadIds.includes(l.id)).length === 0 && (
                    <div style={{ padding: "10px", fontSize: 10, color: C.textDim, textAlign: "center" }}>All matching leads already in campaign</div>
                  )}
                </div>
              )}
            </div>

            {/* Campaign leads */}
            <Hdr>Campaign Leads ({activeCampaign.leadIds.length})</Hdr>
            {activeCampaign.leadIds.length === 0 ? (
              <Card><div style={{ textAlign: "center", padding: 16, color: C.textDim, fontSize: 11 }}>No leads in this campaign. Search above to add.</div></Card>
            ) : (
              activeCampaign.leadIds.map(lid => {
                const l = leads.find(ll => ll.id === lid);
                if (!l) return null;
                const lMailCount = (l.mailings || []).filter(m => m.campaignId === activeCampaign.id).length;
                return (
                  <Card key={lid}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div onClick={() => { setMktLeadId(l.id); setMktView("lead_detail"); }} style={{ cursor: "pointer", flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{l.name} <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.accent, fontWeight: 600, background: C.accentDim, padding: "1px 5px", borderRadius: 3 }}>{l.custId || l.leadId}</span></div>
                        <div style={{ fontSize: 10, color: C.textDim, marginTop: 1 }}>{l.state}{l.phone ? ` · ${l.phone}` : ""}{l.email ? ` · ${l.email}` : ""}</div>
                        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                          {lMailCount > 0 && <Badge color={C.blue} bg={C.blueDim}>{lMailCount} mailed</Badge>}
                          {l.converted && <Badge color={C.accent} bg={C.accentDim}>Converted</Badge>}
                          {!l.converted && lMailCount === 0 && <Badge color={C.textDim} bg={`${C.textDim}22`}>Not mailed</Badge>}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                        <Btn small primary onClick={() => { setMktLeadId(l.id); setMktView("lead_detail"); }}>📬 Mail</Btn>
                        <button onClick={() => removeLeadFromCampaign(activeCampaign.id, lid)} style={{ padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.danger}33`, background: "transparent", color: C.danger, fontSize: 8, fontWeight: 600, cursor: "pointer" }}>Remove</button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </>); })()}

          {/* ── LEAD DETAIL (mail + convert) ── */}
          {mktView === "lead_detail" && mktLead && (<>
            <Btn onClick={() => { setMktView(activeCampaignId ? "campaign_detail" : "campaigns"); setMktLeadId(null); setAddingMail(false); setEditingLeadId(null); }} small style={{ marginBottom: 12 }}>← Back</Btn>

            {/* ── EDIT MODE ── */}
            {editingLeadId === mktLead.id ? (
              <Card style={{ borderColor: `${C.blue}33` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.blue, marginBottom: 10 }}>✏️ Edit Customer — {mktLead.custId || mktLead.leadId}</div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 6 }}>
                  <Inp small id="en2" label="Name" value={editData.name} onChange={e => ed("name", e.target.value)} />
                  <Sel id="es2" label="State" value={editData.state} onChange={e => ed("state", e.target.value)} options={US_STATES.map(s => ({ v: s, l: s }))} />
                </div>
                <Inp small id="eaddr2" label="Address" value={editData.address} onChange={e => ed("address", e.target.value)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <Inp small id="ephone2" label="Phone" value={editData.phone} onChange={e => ed("phone", e.target.value)} />
                  <Inp small id="eemail2" label="Email" value={editData.email} onChange={e => ed("email", e.target.value)} />
                </div>
                <Inp small id="edob2" label="DOB" type="date" value={editData.dob} onChange={e => ed("dob", e.target.value)} />
                <div style={{ background: C.input, borderRadius: 8, padding: 10, marginTop: 6, marginBottom: 6, border: `1px solid ${C.divider}` }}>
                  <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", color: C.textDim, marginBottom: 6 }}>Original Reverse Mortgage</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <Inp small id="eomd2" label="Orig. Mortgage Date" type="date" value={editData.origMortgageDate} onChange={e => ed("origMortgageDate", e.target.value)} />
                    <Inp small id="emc2" label="Max Claim" value={editData.maxClaim} onChange={e => ed("maxClaim", e.target.value)} prefix="$" />
                  </div>
                  <Inp small id="eir2" label="Current Interest Rate" value={editData.interestRate} onChange={e => ed("interestRate", e.target.value)} placeholder="e.g. 6.250" />
                  {pn(editData.maxClaim) > 0 && (
                    <div style={{ background: C.accentDim, borderRadius: 6, padding: "6px 10px", marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 8, color: C.accent, fontWeight: 600 }}>Est. MIP: {fmt(pn(editData.maxClaim))} ÷ 1.5 × 2%</div>
                        {getLLCode(editData.maxClaim, editData.origMortgageDate) && <div style={{ fontSize: 7, color: C.blue, fontWeight: 600 }}>{getLLCode(editData.maxClaim, editData.origMortgageDate)} {pn(editData.maxClaim) > 1815000 && !LL_CODES[String(Math.round(pn(editData.maxClaim)))] ? "Proprietary" : "Loan Limit"}</div>}
                      </div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 700, color: C.accent }}>{fmt(calcMIP(editData.maxClaim))}</div>
                    </div>
                  )}
                </div>
                <Inp small id="esrc2" label="Source" value={editData.source} onChange={e => ed("source", e.target.value)} />
                <Inp small id="enotes2" label="Notes" value={editData.notes} onChange={e => ed("notes", e.target.value)} />
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <Btn primary onClick={saveEditLead} style={{ flex: 1 }}>💾 Save Changes</Btn>
                  <Btn onClick={() => setEditingLeadId(null)} style={{ flex: 1 }}>Cancel</Btn>
                </div>
              </Card>
            ) : (<>
            {/* ── VIEW MODE ── */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: "'Playfair Display',serif" }}>{mktLead.name}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: C.accent, fontWeight: 700, background: C.accentDim, padding: "2px 8px", borderRadius: 5 }}>{mktLead.custId || mktLead.leadId}</span>
                    {mktLead.leadId && mktLead.leadId !== mktLead.custId && <span style={{ fontSize: 9, color: C.textDim }}>Lead: {mktLead.leadId}</span>}
                    <span style={{ fontSize: 10, color: C.textDim }}>{mktLead.state}</span>
                  </div>
                  {mktLead.phone && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>📞 {mktLead.phone}</div>}
                  {mktLead.email && <div style={{ fontSize: 10, color: C.textMuted }}>📧 {mktLead.email}</div>}
                  {mktLead.address && <div style={{ fontSize: 10, color: C.textMuted }}>📍 {mktLead.address}</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                  <Btn small onClick={() => startEditLead(mktLead)} style={{ background: C.blueDim, color: C.blue, border: `1px solid ${C.blue}44` }}>✏️ Edit</Btn>
                  {mktLead.converted ? (
                    <Badge color={C.accent} bg={C.accentDim}>✓ Converted {mktLead.convertedAt}</Badge>
                  ) : (
                    <Btn small onClick={() => setMktView("convert")} style={{ background: C.gold, color: "#000" }}>⚡ Convert Lead</Btn>
                  )}
                </div>
              </div>

              {/* Original Mortgage & MIP */}
              {(mktLead.origMortgageDate || pn(mktLead.maxClaim) > 0) && (
                <div style={{ background: C.input, borderRadius: 8, padding: 10, marginTop: 4, border: `1px solid ${C.divider}` }}>
                  <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", color: C.textDim, marginBottom: 6 }}>Original Reverse Mortgage</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                    {mktLead.origMortgageDate && (
                      <div>
                        <div style={{ fontSize: 8, color: C.textDim }}>Orig. Date</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 600, color: C.text }}>{new Date(mktLead.origMortgageDate + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                        {(() => { const od = new Date(mktLead.origMortgageDate), now = new Date(); const mos = (now.getFullYear() - od.getFullYear()) * 12 + (now.getMonth() - od.getMonth()); return <div style={{ fontSize: 8, color: mos >= 18 ? C.pass : C.fail, fontWeight: 600 }}>{mos}mo {mos >= 18 ? "✓ Seasoned" : "✗ Need 18+"}</div>; })()}
                      </div>
                    )}
                    {pn(mktLead.maxClaim) > 0 && (
                      <div>
                        <div style={{ fontSize: 8, color: C.textDim }}>Max Claim</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 600, color: C.text }}>{fmt(pn(mktLead.maxClaim))}</div>
                      </div>
                    )}
                    {pn(mktLead.maxClaim) > 0 && (
                      <div style={{ background: C.accentDim, borderRadius: 6, padding: "4px 10px" }}>
                        <div style={{ fontSize: 8, color: C.accent, fontWeight: 600 }}>Est. Original MIP</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 700, color: C.accent }}>{fmt(mktLead.mipAmount || calcMIP(mktLead.maxClaim))}</div>
                        <div style={{ fontSize: 7, color: C.textDim }}>{fmt(pn(mktLead.maxClaim))} ÷ 1.5 × 2%</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
            </>)}

            {/* Add mail piece */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: C.textDim }}>Mail History</div>
              <Btn primary small onClick={() => setAddingMail(!addingMail)}>{addingMail ? "Cancel" : "📬 Log Mail"}</Btn>
            </div>

            {addingMail && (
              <Card style={{ borderColor: `${C.purple}44` }}>
                <Hdr>Log Mail Piece</Hdr>
                <Inp small id="mds" label="Date Sent" type="date" value={nm.dateSent} onChange={e => snm(p => ({ ...p, dateSent: e.target.value }))} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <Inp small id="mst" label="Stamp Type" value={nm.stampType} onChange={e => snm(p => ({ ...p, stampType: e.target.value }))} placeholder="Forever, Metered" />
                  <Inp small id="met" label="Envelope Type" value={nm.envelopeType} onChange={e => snm(p => ({ ...p, envelopeType: e.target.value }))} placeholder="#10 White, 6x9" />
                </div>
                <Inp small id="mcost" label="Cost ($)" value={nm.cost} onChange={e => snm(p => ({ ...p, cost: e.target.value }))} prefix="$" placeholder="1.25" />
                <Inp small id="mno" label="Notes" value={nm.notes} onChange={e => snm(p => ({ ...p, notes: e.target.value }))} placeholder="Letter style, color, batch #, etc." />
                <Btn primary onClick={() => addMailToLead(mktLead.id)} style={{ width: "100%", marginTop: 4 }}>Save Mail Piece</Btn>
              </Card>
            )}

            {(mktLead.mailings || []).length === 0 && !addingMail ? (
              <Card><div style={{ textAlign: "center", padding: 16, color: C.textDim, fontSize: 11 }}>No mail logged. Click "Log Mail" to track a piece.</div></Card>
            ) : (
              (mktLead.mailings || []).slice().reverse().map(m => {
                const camp = campaigns.find(cc => cc.id === m.campaignId);
                return (
                  <Card key={m.id} style={{ borderLeft: `3px solid ${C.purple}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                          {m.dateSent && <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{new Date(m.dateSent + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                          {camp && <Badge color={C.purple} bg={C.purpleDim}>{camp.name}</Badge>}
                        </div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: m.notes ? 4 : 0 }}>
                          {m.stampType && <div><span style={{ fontSize: 8, color: C.textDim, textTransform: "uppercase" }}>Stamp: </span><span style={{ fontSize: 10, color: C.text }}>{m.stampType}</span></div>}
                          {m.envelopeType && <div><span style={{ fontSize: 8, color: C.textDim, textTransform: "uppercase" }}>Envelope: </span><span style={{ fontSize: 10, color: C.text }}>{m.envelopeType}</span></div>}
                          {m.cost && <div><span style={{ fontSize: 8, color: C.textDim, textTransform: "uppercase" }}>Cost: </span><span style={{ fontSize: 10, color: C.danger, fontWeight: 600 }}>${parseFloat(m.cost).toFixed(2)}</span></div>}
                        </div>
                        {m.notes && <div style={{ fontSize: 10, color: C.textMuted, fontStyle: "italic" }}>{m.notes}</div>}
                      </div>
                      <button onClick={() => removeMailFromLead(mktLead.id, m.id)} style={{ padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.danger}33`, background: "transparent", color: C.danger, fontSize: 8, fontWeight: 600, cursor: "pointer", flexShrink: 0, marginLeft: 8 }}>✕</button>
                    </div>
                  </Card>
                );
              })
            )}
          </>)}

          {/* ── CONVERT LEAD ── */}
          {mktView === "convert" && mktLead && (<>
            <Btn onClick={() => setMktView("lead_detail")} small style={{ marginBottom: 12 }}>← Back to {mktLead.name}</Btn>
            <Card style={{ borderColor: `${C.gold}44` }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.gold, fontFamily: "'Playfair Display',serif" }}>⚡ Convert Lead</div>
                <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{mktLead.name} · {mktLead.leadId} · {mktLead.state}</div>
              </div>
              <Hdr>Contact Info</Hdr>
              <Inp small id="cvph" label="Phone" value={convertData.phone} onChange={e => setConvertData(p => ({ ...p, phone: e.target.value }))} placeholder={mktLead.phone || "Enter phone number"} />
              <Inp small id="cvem" label="Email" value={convertData.email} onChange={e => setConvertData(p => ({ ...p, email: e.target.value }))} placeholder={mktLead.email || "Enter email"} />
              <Hdr>Loan Details</Hdr>
              <Inp small id="cvdob" label="Date of Birth" type="date" value={convertData.dob} onChange={e => setConvertData(p => ({ ...p, dob: e.target.value }))} hint={convertData.dob ? `Age: ${calcAge(convertData.dob)}` : "For PLF calculation"} />
              <Inp small id="cvbal" label="Current Balance / Payoff" value={convertData.balance} onChange={e => setConvertData(p => ({ ...p, balance: e.target.value }))} prefix="$" />
              <Inp small id="cvpv" label="Property Value" value={convertData.propVal} onChange={e => setConvertData(p => ({ ...p, propVal: e.target.value }))} prefix="$" />
              <Inp small id="cvc" label="Estimated Costs" value={convertData.estCosts} onChange={e => setConvertData(p => ({ ...p, estCosts: e.target.value }))} prefix="$" hint="Origination + closing costs estimate" />

              {/* Quick estimate preview */}
              {convertData.propVal && convertData.dob && (() => {
                const cvAge = calcAge(convertData.dob);
                const cvPV = pn(convertData.propVal);
                const cvMCA = Math.min(cvPV, HECM_LIMIT);
                const cvER = cmtVal + 2.0;
                const cvPLF = cvAge ? getPLF(cvAge, cvER, false) : null;
                const cvPL = cvPLF ? cvMCA * cvPLF : 0;
                const cvNet = Math.max(0, cvPL - pn(convertData.balance) - pn(convertData.estCosts));
                const cvIncome = cvPL * 0.0175;
                return (
                  <div style={{ background: C.accentDim, borderRadius: 8, padding: 12, marginTop: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", color: C.accent, marginBottom: 6 }}>Quick Estimate (2.00% margin)</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                      <div><span style={{ fontSize: 9, color: C.textDim }}>Est. PL: </span><span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "'DM Mono',monospace" }}>{cvPL > 0 ? fmtShort(cvPL) : "—"}</span></div>
                      <div><span style={{ fontSize: 9, color: C.textDim }}>Net Avail: </span><span style={{ fontSize: 12, fontWeight: 700, color: C.gold, fontFamily: "'DM Mono',monospace" }}>{cvPL > 0 ? fmtShort(cvNet) : "—"}</span></div>
                      <div><span style={{ fontSize: 9, color: C.textDim }}>Est. Income: </span><span style={{ fontSize: 12, fontWeight: 700, color: C.accent, fontFamily: "'DM Mono',monospace" }}>{cvPL > 0 ? fmtShort(cvIncome) : "—"}</span></div>
                      <div><span style={{ fontSize: 9, color: C.textDim }}>PLF: </span><span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "'DM Mono',monospace" }}>{cvPLF ? `${(cvPLF * 100).toFixed(1)}%` : "—"}</span></div>
                    </div>
                  </div>
                );
              })()}

              <Btn primary onClick={() => convertLead(mktLead)} style={{ width: "100%", marginTop: 4, background: C.gold, color: "#000" }}>
                ⚡ Convert & Add to Pipeline
              </Btn>
              <div style={{ fontSize: 9, color: C.textDim, textAlign: "center", marginTop: 6 }}>Creates a deal in Pipeline as "Pitched" with HECM ARM @ 2.00% margin estimate</div>
            </Card>
          </>)}

        </>)}

        {/* ═══════ DASHBOARD ═══════ */}
        {view === "dashboard" && (<>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 3px" }}>Dashboard</h1>
            <p style={{ color: C.textDim, fontSize: 10, margin: 0 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
            {/* DB Status */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, padding: "3px 10px", borderRadius: 20, background: dbStatus === "connected" ? C.accentDim : dbStatus === "loading" ? C.warningDim : C.dangerDim }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: dbStatus === "connected" ? C.accent : dbStatus === "loading" ? C.warning : C.danger }} />
              <span style={{ fontSize: 9, color: dbStatus === "connected" ? C.accent : dbStatus === "loading" ? C.warning : C.danger, fontWeight: 600 }}>
                {dbStatus === "connected" ? "Supabase Connected" : dbStatus === "loading" ? "Connecting..." : "Demo Mode (offline)"}
              </span>
            </div>
          </div>

          {/* CSV Import */}
          <Card style={{ borderColor: `${C.blue}33`, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>📥 Bulk Import Leads</div>
                <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>CSV columns: Name, Street Address, City, State, Zip, Lender, Origination Date — plus optional: Phone, Email, DOB, Max Claim, Customer ID</div>
              </div>
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.blue}44`, background: C.blueDim, color: C.blue, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                📄 Choose CSV File
                <input type="file" accept=".csv" onChange={handleCsvImport} style={{ display: "none" }} />
              </label>
              {csvImporting && <span style={{ fontSize: 10, color: C.warning }}>Importing...</span>}
              {csvResult && <span style={{ fontSize: 10, color: csvResult.ok ? C.accent : C.danger, fontWeight: 600 }}>{csvResult.msg}</span>}
            </div>
          </Card>

          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
            <div style={{ background: C.accentDim, borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 8, color: C.accent, fontWeight: 600, textTransform: "uppercase" }}>Active Deals</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 22, fontWeight: 700, color: C.accent }}>{activeDeals.length}</div>
            </div>
            <div style={{ background: C.goldDim, borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 8, color: C.gold, fontWeight: 600, textTransform: "uppercase" }}>Funded Comp</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 22, fontWeight: 700, color: C.gold }}>{fmtShort(fundedIncome)}</div>
            </div>
            <div style={{ background: C.purpleDim, borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 8, color: C.purple, fontWeight: 600, textTransform: "uppercase" }}>Pipeline</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 22, fontWeight: 700, color: C.purple }}>{fmtShort(totalPipelineIncome)}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
            <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: 8, textAlign: "center" }}>
              <div style={{ fontSize: 8, color: C.textDim, fontWeight: 600 }}>Leads</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: C.text }}>{leads.length}</div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: 8, textAlign: "center" }}>
              <div style={{ fontSize: 8, color: C.textDim, fontWeight: 600 }}>Converted</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: C.text }}>{leads.filter(l => l.converted).length}</div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: 8, textAlign: "center" }}>
              <div style={{ fontSize: 8, color: C.textDim, fontWeight: 600 }}>Funded</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: C.text }}>{deals.filter(d => d.status === "Funded").length}</div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: 8, textAlign: "center" }}>
              <div style={{ fontSize: 8, color: C.textDim, fontWeight: 600 }}>Fallout</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: C.text }}>{deals.filter(d => d.status === "Fallout").length}</div>
            </div>
          </div>

          {/* Overdue / upcoming tasks */}
          <Card>
            <Hdr>📋 Tasks & Follow-Ups</Hdr>
            {(() => {
              const today = new Date().toISOString().split("T")[0];
              const overdue = tasks.filter(t => !t.done && t.dueDate && t.dueDate < today);
              const dueToday = tasks.filter(t => !t.done && t.dueDate === today);
              const upcoming = tasks.filter(t => !t.done && t.dueDate && t.dueDate > today).slice(0, 3);
              const noDue = tasks.filter(t => !t.done && !t.dueDate).slice(0, 2);
              const all = [...overdue, ...dueToday, ...upcoming, ...noDue];
              if (all.length === 0) return <div style={{ fontSize: 11, color: C.textDim, textAlign: "center", padding: 8 }}>No open tasks. You're all caught up!</div>;
              return all.slice(0, 5).map(t => {
                const d = deals.find(dd => dd.id === parseInt(t.dealId));
                const isOverdue = t.dueDate && t.dueDate < today;
                return (
                  <div key={t.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.divider}` }}>
                    <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} style={{ accentColor: C.accent, cursor: "pointer" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{t.title}</div>
                      <div style={{ fontSize: 9, color: isOverdue ? C.danger : C.textDim }}>{t.dueDate ? (isOverdue ? "⚠ OVERDUE " : "") + new Date(t.dueDate + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No due date"}{d ? ` · ${d.name}` : ""}</div>
                    </div>
                    {t.priority === "high" && <Badge color={C.danger} bg={C.dangerDim}>!</Badge>}
                  </div>
                );
              });
            })()}
            <Btn small onClick={() => setView("tasks")} style={{ width: "100%", marginTop: 8 }}>View All Tasks →</Btn>
          </Card>

          {/* Deals needing action */}
          <Card>
            <Hdr>⚡ Deals Needing Action</Hdr>
            {activeDeals.length === 0 ? (
              <div style={{ fontSize: 11, color: C.textDim, textAlign: "center", padding: 8 }}>No active deals</div>
            ) : (
              activeDeals.slice(0, 5).map(d => (
                <div key={d.id} onClick={() => { setView("pipeline"); setEditingDeal(d.id); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.divider}`, cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{d.name}</div>
                    <div style={{ fontSize: 9, color: C.textDim }}>{d.productLabel} · {LENDERS[d.lender]?.short}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Badge color={STATUS_COLORS[d.status]} bg={`${STATUS_COLORS[d.status]}22`}>{d.status}</Badge>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.accent, marginTop: 2 }}>{fmtShort(d.brokerIncome)}</div>
                  </div>
                </div>
              ))
            )}
          </Card>

          {/* Marketing snapshot */}
          <Card>
            <Hdr>📬 Marketing Snapshot</Hdr>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: C.purple }}>{globalTotalLetters}</div><div style={{ fontSize: 8, color: C.textDim }}>Letters</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: C.danger }}>{fmt(globalTotalCost)}</div><div style={{ fontSize: 8, color: C.textDim }}>Cost</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: C.gold }}>{fmtShort(globalFundedComp)}</div><div style={{ fontSize: 8, color: C.textDim }}>Funded Comp</div></div>
            </div>
          </Card>

          {/* ── Closing Calendar on Dashboard ── */}
          <Card>
            <Hdr>📅 Deal Timeline</Hdr>
            {deals.length === 0 ? (
              <div style={{ fontSize: 11, color: C.textDim, textAlign: "center", padding: 8 }}>No deals in pipeline yet.</div>
            ) : (<>
              {STATUSES.filter(s => s !== "Fallout").map(status => {
                const sDeals = deals.filter(d => d.status === status);
                if (sDeals.length === 0) return null;
                return (
                  <div key={status} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[status] }} />
                      <div style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLORS[status] }}>{status}</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.textDim }}>{sDeals.length} deal{sDeals.length !== 1 ? "s" : ""}</div>
                      {(status === "Funded" || status === "CTC") && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.gold, marginLeft: "auto" }}>{fmtShort(sDeals.reduce((s, d) => s + d.brokerIncome, 0))}</span>}
                    </div>
                    {sDeals.slice(0, 3).map(d => (
                      <div key={d.id} onClick={() => { setView("pipeline"); setEditingDeal(d.id); }} style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", background: `${STATUS_COLORS[status]}11`, border: `1px solid ${STATUS_COLORS[status]}33`, borderRadius: 6, marginBottom: 3, cursor: "pointer" }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: C.text }}>{d.name}</div>
                          <div style={{ fontSize: 8, color: C.textDim }}>{d.leadId} · {d.state} · {d.productLabel}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, fontWeight: 700, color: C.accent }}>{fmtShort(d.brokerIncome)}</div>
                          <div style={{ fontSize: 7, color: C.textDim }}>{d.createdAt}</div>
                        </div>
                      </div>
                    ))}
                    {sDeals.length > 3 && <div style={{ fontSize: 9, color: STATUS_COLORS[status], textAlign: "center", padding: 2, cursor: "pointer" }} onClick={() => setView("calendar")}>+{sDeals.length - 3} more →</div>}
                  </div>
                );
              })}
              {deals.filter(d => d.status === "Fallout").length > 0 && (
                <div style={{ fontSize: 9, color: C.textDim, textAlign: "center", paddingTop: 4, borderTop: `1px solid ${C.divider}` }}>
                  {deals.filter(d => d.status === "Fallout").length} fallout deal{deals.filter(d => d.status === "Fallout").length !== 1 ? "s" : ""} hidden
                </div>
              )}
            </>)}
          </Card>

          {/* Expenses snapshot */}
          <Card>
            <Hdr>💰 Monthly P&L</Hdr>
            {(() => {
              const thisMonth = new Date().toISOString().slice(0, 7);
              const monthExp = expenses.filter(e => e.date && e.date.startsWith(thisMonth)).reduce((s, e) => s + pn(e.amount), 0);
              const monthFunded = deals.filter(d => d.status === "Funded").reduce((s, d) => s + d.brokerIncome, 0);
              const profit = monthFunded - monthExp - globalTotalCost;
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: C.accent }}>{fmtShort(monthFunded)}</div><div style={{ fontSize: 8, color: C.textDim }}>Revenue</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: C.danger }}>{fmtShort(monthExp + globalTotalCost)}</div><div style={{ fontSize: 8, color: C.textDim }}>Expenses</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: profit >= 0 ? C.accent : C.danger }}>{fmtShort(profit)}</div><div style={{ fontSize: 8, color: C.textDim }}>Profit</div></div>
                </div>
              );
            })()}
          </Card>
        </>)}

        {/* ═══════ TASKS ═══════ */}
        {view === "tasks" && (<>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>Tasks & Follow-Ups</h2>
            <Btn primary small onClick={() => setAddingTask(!addingTask)}>{addingTask ? "Cancel" : "+ Add Task"}</Btn>
          </div>

          {addingTask && (
            <Card style={{ borderColor: `${C.accent}44` }}>
              <Hdr>New Task</Hdr>
              <Inp small id="tt" label="Task / Follow-Up" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Call Mrs. Johnson re: insurance dec page" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <Inp small id="td" label="Due Date" type="date" value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))} />
                <Sel id="tp" label="Priority" value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))} options={[{ v: "low", l: "Low" }, { v: "normal", l: "Normal" }, { v: "high", l: "High" }]} />
              </div>
              <Sel id="tdeal" label="Link to Deal (optional)" value={newTask.dealId} onChange={e => setNewTask(p => ({ ...p, dealId: e.target.value }))} options={[{ v: "", l: "— None —" }, ...deals.map(d => ({ v: String(d.id), l: `${d.name} (${d.leadId})` }))]} />
              <Inp small id="tnote" label="Notes" value={newTask.notes} onChange={e => setNewTask(p => ({ ...p, notes: e.target.value }))} placeholder="Additional details..." />
              <Btn primary onClick={addTask} style={{ width: "100%", marginTop: 4 }}>Save Task</Btn>
            </Card>
          )}

          {/* Open tasks */}
          {(() => {
            const today = new Date().toISOString().split("T")[0];
            const open = tasks.filter(t => !t.done).sort((a, b) => {
              if (!a.dueDate && !b.dueDate) return 0; if (!a.dueDate) return 1; if (!b.dueDate) return -1;
              return a.dueDate.localeCompare(b.dueDate);
            });
            const done = tasks.filter(t => t.done);
            return (<>
              {open.length === 0 && !addingTask && <Card><div style={{ textAlign: "center", padding: 16, color: C.textDim, fontSize: 12 }}>No open tasks. 🎉</div></Card>}
              {open.map(t => {
                const d = deals.find(dd => dd.id === parseInt(t.dealId));
                const isOverdue = t.dueDate && t.dueDate < today;
                return (
                  <Card key={t.id} style={{ borderLeft: `3px solid ${t.priority === "high" ? C.danger : t.priority === "low" ? C.textDim : C.accent}` }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <input type="checkbox" checked={false} onChange={() => toggleTask(t.id)} style={{ marginTop: 3, accentColor: C.accent, cursor: "pointer" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{t.title}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                          {t.dueDate && <Badge color={isOverdue ? C.danger : C.textMuted} bg={isOverdue ? C.dangerDim : `${C.textDim}22`}>{isOverdue ? "⚠ OVERDUE " : ""}{new Date(t.dueDate + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Badge>}
                          {t.priority === "high" && <Badge color={C.danger} bg={C.dangerDim}>High Priority</Badge>}
                          {d && <Badge color={C.blue} bg={C.blueDim}>{d.name}</Badge>}
                        </div>
                        {t.notes && <div style={{ fontSize: 9, color: C.textMuted, marginTop: 4, fontStyle: "italic" }}>{t.notes}</div>}
                      </div>
                      <button onClick={() => deleteTask(t.id)} style={{ padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.danger}33`, background: "transparent", color: C.danger, fontSize: 8, cursor: "pointer" }}>✕</button>
                    </div>
                  </Card>
                );
              })}
              {done.length > 0 && (<>
                <Hdr>Completed ({done.length})</Hdr>
                {done.slice(0, 10).map(t => (
                  <div key={t.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${C.divider}` }}>
                    <input type="checkbox" checked onChange={() => toggleTask(t.id)} style={{ accentColor: C.accent, cursor: "pointer" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: C.textDim, textDecoration: "line-through" }}>{t.title}</div>
                      <div style={{ fontSize: 8, color: C.textDim }}>Completed {t.completedAt}</div>
                    </div>
                    <button onClick={() => deleteTask(t.id)} style={{ padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.danger}33`, background: "transparent", color: C.danger, fontSize: 8, cursor: "pointer" }}>✕</button>
                  </div>
                ))}
              </>)}
            </>);
          })()}
        </>)}

        {/* ═══════ MORE ═══════ */}
        {view === "more" && (<>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 12px" }}>Tools</h2>
          {[
            { k: "licensing", icon: "📜", label: "Licensing & Compliance", desc: "MLO setup checklists & state requirements" },
            { k: "referrals", icon: "🤝", label: "Referral Partners", desc: "Track who sends you deals" },
            { k: "expenses", icon: "💰", label: "Expense Tracker", desc: "Licensing, E&O, overhead" },
            { k: "calendar", icon: "📅", label: "Closing Calendar", desc: "Upcoming closes & appointments" },
          ].map(item => (
            <Card key={item.k} style={{ cursor: "pointer" }}>
              <div onClick={() => setView(item.k)} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 24 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: C.textDim }}>{item.desc}</div>
                </div>
              </div>
            </Card>
          ))}
        </>)}

        {/* ═══════ LICENSING & COMPLIANCE ═══════ */}
        {view === "licensing" && (<>
          <Btn onClick={() => setView("more")} small style={{ marginBottom: 12 }}>← Back</Btn>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>📜 Licensing & Compliance</h2>
          <p style={{ fontSize: 10, color: C.textDim, margin: "0 0 14px" }}>Checklists for MLO setup and state-specific requirements</p>

          {/* Sub-tabs */}
          <div style={{ display: "flex", gap: 0, marginBottom: 14, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.cardBorder}` }}>
            {[
              { k: "solo", l: "Solo LO Shop" },
              { k: "AZ", l: "AZ" },
              { k: "CA", l: "CA" },
              { k: "FL", l: "FL" },
              { k: "WA", l: "WA" },
            ].map(t => (
              <button key={t.k} onClick={() => setLicTab(t.k)} style={{ flex: 1, padding: "8px 2px", background: licTab === t.k ? C.accentDim : C.card, border: "none", borderRight: `1px solid ${C.cardBorder}`, color: licTab === t.k ? C.accent : C.textDim, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>{t.l}</button>
            ))}
          </div>

          {/* Solo Shop Checklist */}
          {licTab === "solo" && (<>
            <Card style={{ borderColor: `${C.accent}44` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{LIC_SOLO_SHOP.title}</div>
              <div style={{ fontSize: 10, color: C.textDim, marginBottom: 8 }}>{LIC_SOLO_SHOP.desc}</div>
              {(() => {
                const allItems = LIC_SOLO_SHOP.sections.flatMap(s => s.items);
                const done = allItems.filter(i => licChecks[`solo::${i}`]).length;
                const pct = Math.round(done / allItems.length * 100);
                return (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.textDim, marginBottom: 3 }}>
                      <span>{done}/{allItems.length} complete</span><span>{pct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: C.input }}>
                      <div style={{ height: "100%", borderRadius: 3, background: pct === 100 ? C.accent : C.blue, width: `${pct}%`, transition: "width 0.3s" }} />
                    </div>
                  </div>
                );
              })()}
            </Card>
            {LIC_SOLO_SHOP.sections.map(section => (
              <Card key={section.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Hdr>{section.name}</Hdr>
                  <span style={{ fontSize: 9, color: C.textDim }}>{licCount("solo", section.items)}/{section.items.length}</span>
                </div>
                {section.items.map(item => {
                  const checked = licChecks[`solo::${item}`];
                  return (
                    <div key={item} onClick={() => toggleLic("solo", item)} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.divider}`, cursor: "pointer" }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${checked ? C.accent : C.inputBorder}`, background: checked ? C.accentDim : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.accent, flexShrink: 0, marginTop: 1 }}>{checked ? "✓" : ""}</div>
                      <div style={{ fontSize: 11, color: checked ? C.textDim : C.text, textDecoration: checked ? "line-through" : "none", lineHeight: 1.4 }}>{item}</div>
                    </div>
                  );
                })}
              </Card>
            ))}
          </>)}

          {/* State-specific checklists */}
          {LIC_STATES.filter(s => s.state === licTab).map(st => (<div key={st.state}>
            <Card style={{ borderColor: `${C.blue}44` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{st.name} MLO License</div>
              <div style={{ fontSize: 10, color: C.textDim, marginBottom: 2 }}>Regulator: {st.regulator}</div>
              {(() => {
                const allItems = st.sections.flatMap(s => s.items);
                const done = allItems.filter(i => licChecks[`${st.state}::${i}`]).length;
                const pct = Math.round(done / allItems.length * 100);
                return (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.textDim, marginBottom: 3 }}>
                      <span>{done}/{allItems.length} complete</span><span>{pct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: C.input }}>
                      <div style={{ height: "100%", borderRadius: 3, background: pct === 100 ? C.accent : C.blue, width: `${pct}%`, transition: "width 0.3s" }} />
                    </div>
                  </div>
                );
              })()}
            </Card>
            {st.sections.map(section => (
              <Card key={section.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Hdr>{section.name}</Hdr>
                  <span style={{ fontSize: 9, color: C.textDim }}>{licCount(st.state, section.items)}/{section.items.length}</span>
                </div>
                {section.items.map(item => {
                  const checked = licChecks[`${st.state}::${item}`];
                  const isOption = item.startsWith("OPTION");
                  return (
                    <div key={item} onClick={() => toggleLic(st.state, item)} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.divider}`, cursor: "pointer" }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${checked ? C.accent : C.inputBorder}`, background: checked ? C.accentDim : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.accent, flexShrink: 0, marginTop: 1 }}>{checked ? "✓" : ""}</div>
                      <div style={{ fontSize: 11, color: checked ? C.textDim : isOption ? C.blue : C.text, textDecoration: checked ? "line-through" : "none", lineHeight: 1.4, fontWeight: isOption ? 600 : 400 }}>{item}</div>
                    </div>
                  );
                })}
              </Card>
            ))}
          </div>))}

          <Card style={{ background: C.input }}>
            <div style={{ fontSize: 9, color: C.textDim, textAlign: "center", lineHeight: 1.5 }}>
              ⚠️ This checklist is for reference only and may not reflect the most current requirements. Always verify directly with NMLS (nationwidelicensingsystem.org) and your state regulator before relying on this information. Requirements and fees are subject to change.
            </div>
          </Card>
        </>)}

        {/* ═══════ REFERRAL PARTNERS ═══════ */}
        {view === "referrals" && (<>
          <Btn onClick={() => setView("more")} small style={{ marginBottom: 12 }}>← Back</Btn>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>🤝 Referral Partners</h2>
            <Btn primary small onClick={() => setAddingReferral(!addingReferral)}>{addingReferral ? "Cancel" : "+ Add"}</Btn>
          </div>

          {addingReferral && (
            <Card style={{ borderColor: `${C.teal}44` }}>
              <Hdr>New Referral Partner</Hdr>
              <Inp small id="rn" label="Name" value={newRef.name} onChange={e => setNewRef(p => ({ ...p, name: e.target.value }))} placeholder="John Smith" />
              <Sel id="rt" label="Type" value={newRef.type} onChange={e => setNewRef(p => ({ ...p, type: e.target.value }))} options={REF_TYPES.map(t => ({ v: t, l: t }))} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <Inp small id="rph" label="Phone" value={newRef.phone} onChange={e => setNewRef(p => ({ ...p, phone: e.target.value }))} />
                <Inp small id="rem" label="Email" value={newRef.email} onChange={e => setNewRef(p => ({ ...p, email: e.target.value }))} />
              </div>
              <Inp small id="rno" label="Notes" value={newRef.notes} onChange={e => setNewRef(p => ({ ...p, notes: e.target.value }))} placeholder="Firm, relationship notes" />
              <Btn primary onClick={() => { if (!newRef.name.trim()) return; const ref = { ...newRef, id: Date.now(), createdAt: new Date().toLocaleDateString() }; setReferrals(p => [ref, ...p]); sb.upsert("referrals", { id: ref.id, name: ref.name, type: ref.type, phone: ref.phone, email: ref.email, notes: ref.notes, created_at: ref.createdAt }); setNewRef({ name: "", type: "Financial Advisor", phone: "", email: "", notes: "" }); setAddingReferral(false); }} style={{ width: "100%", marginTop: 4 }}>Save Partner</Btn>
            </Card>
          )}

          {referrals.length === 0 && !addingReferral ? (
            <Card><div style={{ textAlign: "center", padding: 16, color: C.textDim, fontSize: 12 }}>No referral partners yet.</div></Card>
          ) : (
            referrals.map(r => {
              const refDeals = deals.filter(d => leads.find(l => l.leadId === d.leadId && l.source && l.source.toLowerCase().includes(r.name.toLowerCase())));
              const refFunded = refDeals.filter(d => d.status === "Funded");
              return (
                <Card key={r.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{r.name}</div>
                      <div style={{ fontSize: 10, color: C.textDim }}>{r.type}{r.phone ? ` · ${r.phone}` : ""}{r.email ? ` · ${r.email}` : ""}</div>
                      {r.notes && <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2, fontStyle: "italic" }}>{r.notes}</div>}
                      <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                        {refDeals.length > 0 && <Badge color={C.blue} bg={C.blueDim}>{refDeals.length} deals</Badge>}
                        {refFunded.length > 0 && <Badge color={C.gold} bg={C.goldDim}>{refFunded.length} funded · {fmtShort(refFunded.reduce((s, d) => s + d.brokerIncome, 0))}</Badge>}
                      </div>
                    </div>
                    <button onClick={() => { setReferrals(p => p.filter(rr => rr.id !== r.id)); sb.del("referrals", { id: r.id }); }} style={{ padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.danger}33`, background: "transparent", color: C.danger, fontSize: 8, cursor: "pointer" }}>✕</button>
                  </div>
                </Card>
              );
            })
          )}
        </>)}

        {/* ═══════ EXPENSES ═══════ */}
        {view === "expenses" && (<>
          <Btn onClick={() => setView("more")} small style={{ marginBottom: 12 }}>← Back</Btn>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>💰 Expenses</h2>
            <Btn primary small onClick={() => setAddingExpense(!addingExpense)}>{addingExpense ? "Cancel" : "+ Add"}</Btn>
          </div>

          {/* Expense summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
            <div style={{ background: C.dangerDim, borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: C.danger, fontWeight: 600, textTransform: "uppercase" }}>Total Expenses</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: C.danger }}>{fmt(expenses.reduce((s, e) => s + pn(e.amount), 0))}</div>
            </div>
            <div style={{ background: C.goldDim, borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: C.gold, fontWeight: 600, textTransform: "uppercase" }}>Net vs Funded</div>
              {(() => { const exp = expenses.reduce((s, e) => s + pn(e.amount), 0); const net = fundedIncome - exp - globalTotalCost; return <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: net >= 0 ? C.accent : C.danger }}>{fmtShort(net)}</div>; })()}
            </div>
          </div>

          {addingExpense && (
            <Card style={{ borderColor: `${C.danger}44` }}>
              <Hdr>New Expense</Hdr>
              <Inp small id="ed" label="Description" value={newExp.description} onChange={e => setNewExp(p => ({ ...p, description: e.target.value }))} placeholder="e.g. E&O Insurance Renewal" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <Inp small id="ea" label="Amount" value={newExp.amount} onChange={e => setNewExp(p => ({ ...p, amount: e.target.value }))} prefix="$" />
                <Inp small id="edt" label="Date" type="date" value={newExp.date} onChange={e => setNewExp(p => ({ ...p, date: e.target.value }))} />
              </div>
              <Sel id="ec" label="Category" value={newExp.category} onChange={e => setNewExp(p => ({ ...p, category: e.target.value }))} options={EXP_CATEGORIES.map(c => ({ v: c, l: c }))} />
              <Inp small id="eno" label="Notes" value={newExp.notes} onChange={e => setNewExp(p => ({ ...p, notes: e.target.value }))} />
              <Btn primary onClick={() => { if (!newExp.description.trim() || !newExp.amount) return; const exp = { ...newExp, id: Date.now() }; setExpenses(p => [exp, ...p]); sb.upsert("expenses", { id: exp.id, description: exp.description, amount: exp.amount, category: exp.category, date: exp.date, notes: exp.notes }); setNewExp({ description: "", amount: "", category: "Marketing", date: "", notes: "" }); setAddingExpense(false); }} style={{ width: "100%", marginTop: 4 }}>Save Expense</Btn>
            </Card>
          )}

          {expenses.length === 0 && !addingExpense ? (
            <Card><div style={{ textAlign: "center", padding: 16, color: C.textDim, fontSize: 12 }}>No expenses logged.</div></Card>
          ) : (
            expenses.map(e => (
              <Card key={e.id} style={{ borderLeft: `3px solid ${C.danger}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{e.description}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <Badge color={C.danger} bg={C.dangerDim}>{fmt(pn(e.amount))}</Badge>
                      <Badge color={C.textMuted} bg={`${C.textDim}22`}>{e.category}</Badge>
                      {e.date && <span style={{ fontSize: 9, color: C.textDim }}>{new Date(e.date + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                    </div>
                    {e.notes && <div style={{ fontSize: 9, color: C.textMuted, marginTop: 3, fontStyle: "italic" }}>{e.notes}</div>}
                  </div>
                  <button onClick={() => { setExpenses(p => p.filter(ee => ee.id !== e.id)); sb.del("expenses", { id: e.id }); }} style={{ padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.danger}33`, background: "transparent", color: C.danger, fontSize: 8, cursor: "pointer" }}>✕</button>
                </div>
              </Card>
            ))
          )}
        </>)}

        {/* ═══════ CLOSING CALENDAR ═══════ */}
        {view === "calendar" && (<>
          <Btn onClick={() => setView("more")} small style={{ marginBottom: 12 }}>← Back</Btn>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 12px" }}>📅 Deal Timeline</h2>

          {/* Pipeline by status */}
          {STATUSES.filter(s => s !== "Fallout").map(status => {
            const sDeals = deals.filter(d => d.status === status);
            if (sDeals.length === 0) return null;
            return (
              <div key={status} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: STATUS_COLORS[status] }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[status] }}>{status} ({sDeals.length})</div>
                  {(status === "Funded" || status === "CTC") && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.gold }}>{fmtShort(sDeals.reduce((s, d) => s + d.brokerIncome, 0))}</span>}
                </div>
                {sDeals.map(d => (
                  <div key={d.id} onClick={() => { setView("pipeline"); setEditingDeal(d.id); }} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 6, marginBottom: 4, cursor: "pointer" }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{d.name}</div>
                      <div style={{ fontSize: 9, color: C.textDim }}>{d.leadId} · {d.state} · {d.productLabel}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 700, color: C.accent }}>{fmtShort(d.brokerIncome)}</div>
                      <div style={{ fontSize: 8, color: C.textDim }}>{d.createdAt}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {deals.length === 0 && <Card><div style={{ textAlign: "center", padding: 16, color: C.textDim, fontSize: 12 }}>No deals in pipeline yet.</div></Card>}
        </>)}

        {/* Footer */}
        <div style={{ fontSize: 8, color: C.textDim, textAlign: "center", padding: "8px 0 16px", lineHeight: 1.5 }}>
          Reverse by Reece · HECM-to-HECM Refi Calculator · 2026<br />
          Estimates only — for licensed professionals. Verify rates/comp with your AE.<br />
          HECM limit $1,249,125 (ML 2025-22) · HECM ARM margins 1.25%–3.00%<br />
          FOA rates eff 2/10/26 · MoO rates eff 2/17/26 · Proprietary products not FHA-insured<br />
          HomeSafe: nationwide, no orig fee · SecureEquity+: ~14 states, fixed lump sum only<br />
          3:1 bona fide benefit · 5:1 counseling waiver (ML 2009-21) · Not financial advice.
        </div>
      </div>
      </>)}
    </div>
  );
}
