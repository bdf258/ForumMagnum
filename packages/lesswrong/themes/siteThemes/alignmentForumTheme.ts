
const sansSerifStack = [
  'GreekFallback', // Ensures that greek letters render consistently
  '"freight-sans-pro"',
  'Frutiger',
  '"Frutiger Linotype"',
  'Univers',
  'Calibri',
  '"Gill Sans"',
  '"Gill Sans MT"',
  "Myriad Pro",
  'Myriad',
  '"Liberation Sans"',
  '"Nimbus Sans L"',
  'Tahoma',
  'Geneva',
  '"Helvetica Neue"',
  'Helvetica',
  'Arial',
  'sans-serif'
].join(',')

export const alignmentForumTheme: SiteThemeSpecification = {
  shadePalette: {
    fonts: {
      sansSerifStack,
      serifStack: sansSerifStack, //No serifs on Alignment Forum
    },
  },
  componentPalette: (shadePalette: ThemeShadePalette) => ({
    primary: {
      main: shadePalette.type === "dark" ? "#7581d1": "#3f51b5",
      dark: shadePalette.type === "dark" ? "#7986cb": "#303f9f",
      light: shadePalette.type === "dark" ? "#5968c9": "#7986cb",
      contrastText: shadePalette.grey[0],
    },
    secondary: {
      main: "#3f51b5",
      dark: "#303f9f",
      light: "#7986cb",
      contrastText: shadePalette.grey[0],
    },
    review: {
      activeProgress: "rgba(63,81,181, .5)",
      progressBar: "rgba(63,81,181, 1)"
    },
    lwTertiary: {
      main:  shadePalette.type === "dark" ? "#7799a4" : "#607e88",
      dark:  shadePalette.type === "dark" ? "#7799a4" : "#607e88",
    },
    error: {
      main: '#bf360c',
    },
    background: {
      default: shadePalette.grey[60],
    },
    header: {
      text: shadePalette.type === "dark" ? "#ffffff" : "rgba(0,0,0,0.87)",
      background: shadePalette.type === "dark" ? "rgba(0,0,0,0.5)" : "#ffffff",
    },
    link: {
      visited: "#8c4298",
    }
  }),
  make: (palette: ThemePalette) => ({
    zIndexes: {
      searchResults: 1100,
      intercomButton: 1030,
    },
    typography: {
      fontFamily: sansSerifStack,
      postStyle: {
        fontFamily: sansSerifStack,
        fontVariantNumeric: "lining-nums",
      },
      headerStyle: {
        fontFamily: sansSerifStack,
      },
      commentStyle: {
        fontFamily: sansSerifStack,
        fontVariantNumeric: "lining-nums",
      },
      errorStyle: {
        color: palette.error!.main!,
        fontFamily: sansSerifStack
      },
      title: {
        fontWeight: 500,
      },
      display2: {
        fontWeight: 500
      },
      display3: {
        fontWeight: 500
      },
      uiSecondary: {
        fontFamily: sansSerifStack,
      },
    },
    overrides: {
    }
  }),
};

export default alignmentForumTheme;
