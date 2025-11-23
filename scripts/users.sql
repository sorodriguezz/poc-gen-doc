CREATE TABLE public.users (
                              id serial PRIMARY KEY,
                              first_name varchar(100) NOT NULL,
                              last_name varchar(100) NOT NULL,
                              email varchar(200) NOT NULL UNIQUE
);

INSERT INTO public.users (first_name, last_name, email)
SELECT
    'User_' || g,
    'Last_' || g,
    'user_' || g || '@example.com'
FROM generate_series(1, 100000) AS g;
