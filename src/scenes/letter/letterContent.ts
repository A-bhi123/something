/**
 * Everything the visitor reads in the letter scene.
 * Later the admin panel will replace this object with data from the backend; the scene only reads this shape.
 */
export type LetterBlock = { text: string } | "gap";

export const letterContent = {
  /** Small line shown under the envelope before the countdown. */
  caption: "Ek chhoti si chitthi, sirf tumhare liye…",
  /** Blocks are paragraphs that wrap naturally; "gap" is one empty ruled line. */
  body: [
    { text: "My Love," },
    {
      text: "Pata hai, kabhi-kabhi sochta hoon ki kuch log kitne ajeeb tareeke se life ka hissa ban jaate hain, Na unse roz mulaqat hoti hai, na saath baithkar baatein kar paate hain, na hi kabhi saamne se unki smile dekh paate hain... Bas ek screen ke is paar se us paar tak kuch messages, kuch conversations aur dher saari chhoti-chhoti baatein."},
    "gap",
    {
      text: " Lekin phir bhi, kuch log door rehkar bhi apnepan ka ehsaas kara dete hain. Aur tum unhi mein se ek ho. ❤️  Hamari mulaqatein bhale hi online hoti hain, lekin un baaton mein bhi ek alag si sweetness hai. Kabhi kisi random topic par baat karna, kabhi bina kisi reason ke hasi-mazaak, kabhi chhoti si conversation aur kabhi pata hi nahi chalta ki waqt kab beet gaya.Shayad tumhe iska ehsaas na ho, lekin tumhare saath hone wali ye chhoti-chhoti conversations bhi mere liye beautiful memories hain.Kabhi-kabhi ek simple sa message bhi chehre par smile le aata hai. Aur kabhi kisi ki bas ek chhoti si baat poore din ko achha bana deti hai.Distance zaroor hai, lekin iska matlab ye nahi ki har connection ko paas rehkar hi mehsoos kiya jaaye.",
    },
    {
      text: "Main nahi jaanta ki future mein kitni mulaqatein hongi, kitni memories banengi ya waqt humein kahan lekar jaayega. Lekin itna zaroor jaanta hoon ki tumhari khushi mere liye genuinely matter karti hai.Main chahta hoon ki tum hamesha khush raho, tumhare saare dreams poore hon, tumhari life mein kabhi khushiyon ki kami na ho aur jab bhi tum khud ko dekho, tumhe apni worth par kabhi doubt na ho.Aur haan, kabhi apni smile mat khona. Kyunki kuch smiles screen ke through bhi kisi ka din khoobsurat bana sakti hain. ❤️Kaash kabhi distance sirf ek map par dikhne wali doori ban kar reh jaaye aur hum kisi din bina screen ke bhi baithkar wahi random baatein kar sakein.Tab tak, ye chhoti-chhoti online conversations aur unse judi memories hi kaafi khoobsurat hain."    },
    "gap",
    { text: "Thank you for being a beautiful part of my little world." },
    "gap",
    { text: "Aaj tumhara birthday hai, toh meri taraf se tumhare liye ek hi dua hai — zindagi tumhe utni hi khushiyan de jitni tum deserve karti ho, tumhare chehre par hamesha smile rahe aur tumhara har aane wala saal pichhle saal se zyada beautiful ho.Happy Birthday! 🎂❤️Hamesha khush rehna, haste rehna aur apni woh beautiful si personality kabhi mat badalna.With lots of love and warm wishes," },
    /* TODO(you): replace with your name — this is the only placeholder left in the letter. */
    { text: "With lots of love and warm wishes" },
    "gap",
    { text: "Abhi ❤️" },
  ] as LetterBlock[],
};
