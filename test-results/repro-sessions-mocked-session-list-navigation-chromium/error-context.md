# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - img [ref=e8]
      - heading "Welcome back" [level=1] [ref=e10]
      - paragraph [ref=e11]: Log in to your account
    - button "Continue with Google" [ref=e12] [cursor=pointer]:
      - img [ref=e13]
      - text: Continue with Google
    - generic [ref=e22]: or continue with email
    - generic [ref=e23]:
      - generic [ref=e24]:
        - generic [ref=e25]: Email
        - generic [ref=e26]:
          - img [ref=e28]
          - textbox "Email" [ref=e31]:
            - /placeholder: you@example.com
      - generic [ref=e32]:
        - generic [ref=e33]: Password
        - generic [ref=e34]:
          - img [ref=e36]
          - textbox "Password" [ref=e39]:
            - /placeholder: ••••••••
      - button "Log in" [ref=e40] [cursor=pointer]
    - paragraph [ref=e41]:
      - text: Don't have an account?
      - link "Sign up" [ref=e42] [cursor=pointer]:
        - /url: /register
  - alert [ref=e43]
```