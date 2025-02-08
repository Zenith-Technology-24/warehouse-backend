export const mess1 = `
Pano mag lulu sa CR:

Best time ng pag lulu ay after kumain para busy na ang lahat. At kanya kanyang mundo na.

Step 1: Obserbahan ang family members. Siguraduhin na walang gagamit sa kanila sa ng CR habang ikaw ay nasa loob na. Mahirap pag nabibitin.

Step 2: Tanggalin ang tabo sa balde at buksan ang gripo dahil baka mag hinala sila pag tahimik ka sa CR at saktong lakas lang ng tubig para hindi agad mapuno ang balde.

Step 3: Kung may panonoorin sa phone, siguraduhing naka off ang volume at naka silent ang phone. Baka biglang tumawag ang rider ng iyong parcel.

Step 4: Kung tapos na sa milagro. Magpanggap na magbubuhos sa inidoro at basain ang iyong kamay. Para walang mag duda. At iisipin nila nag pupu ka at hindi nag lulu.

Step 5: Kung sakaling pag labas mo ng CR ay may nakakita sayo sabihin ang magic word na "Dami ko atang nakain kaya humilab tiyan ko" sabay fake smile.

Enjoy sa pag lulu sarap beh.
`;

export const mess2 = `
SOBRANG LATINA! PUTANG INA SARAP TALAGA NG BABAE NA TO OH! HAYOP KA TALAGA! ANG GANDA GANDA MO SHET KA TALAGA PARANG UNANG 
TINGIN SAYO LALABASAN NA AGAD AKO SOBRANG GANDA MO OH! KA GWAPA VA UYTCHHHH! GRABE ANG PAGKA MONYEKA SA BABAE! MONYEKA! LATINA! 
GORJUICE! SOBRANG SARAP! GRABE SHETT! "PANGIT" DI AKO PANGIT!
`;

export const mess3 = `
lightly hold ah okayy woooo! haaaaa aY lORdDD! OWemJiI! OWWWMAYGAAADD! mEGanOOON!? AYYY BAT AKO BUMABALIKTAD!?

owwwwwwmaygad. lightly hold okayyyyyy. ano ba to? haaah

ITO NA! owwwMaYGaD! AAAAAAAHH!! bUmiBILiiISS owWWEmJII AAAAYYYY!

nakakaloka! mas gusto ko yung diretso yung bumps na yan! hindi masaya ang galing ng pagkaka-construct ha taray!

hindi naman siya nakakahilo pero masaya naman!
`;

export const getRandomMessage = (): string => {
    const messages = [mess1, mess2, mess3].filter(msg => msg.trim().length > 0);
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
};