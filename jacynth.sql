--
-- PostgreSQL database dump
--

-- Dumped from database version 12.7 (Ubuntu 12.7-0ubuntu0.20.04.1)
-- Dumped by pg_dump version 12.7 (Ubuntu 12.7-0ubuntu0.20.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: add_game_record(character varying, integer, character varying, integer, character varying); Type: FUNCTION; Schema: public; Owner: jacynth_user
--

CREATE FUNCTION public.add_game_record(u1_id character varying, u1_score integer, u2_id character varying, u2_score integer, layout character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
        DECLARE gameid int;
        BEGIN
                INSERT INTO users (id) VALUES (u1_id), (u2_id) ON CONFLICT (id) DO NOTHING;
                INSERT INTO games (id, end_time, layout_id) VALUES (default, default, (select (id) FROM layouts WHERE name = layout)) RETURNING id INTO gameid;
                INSERT INTO users_games (user_id, game_id, score) VALUES (u1_id, gameid, u1_score), (u2_id, gameid, u2_score);
        END;
$$;


ALTER FUNCTION public.add_game_record(u1_id character varying, u1_score integer, u2_id character varying, u2_score integer, layout character varying) OWNER TO jacynth_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: games; Type: TABLE; Schema: public; Owner: jacynth_user
--

CREATE TABLE public.games (
    id integer NOT NULL,
    end_time timestamp without time zone DEFAULT now() NOT NULL,
    layout_id integer NOT NULL
);


ALTER TABLE public.games OWNER TO jacynth_user;

--
-- Name: games_id_seq; Type: SEQUENCE; Schema: public; Owner: jacynth_user
--

CREATE SEQUENCE public.games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.games_id_seq OWNER TO jacynth_user;

--
-- Name: games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jacynth_user
--

ALTER SEQUENCE public.games_id_seq OWNED BY public.games.id;


--
-- Name: layouts; Type: TABLE; Schema: public; Owner: jacynth_user
--

CREATE TABLE public.layouts (
    id integer NOT NULL,
    name character varying(15) NOT NULL
);


ALTER TABLE public.layouts OWNER TO jacynth_user;

--
-- Name: layouts_id_seq; Type: SEQUENCE; Schema: public; Owner: jacynth_user
--

CREATE SEQUENCE public.layouts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.layouts_id_seq OWNER TO jacynth_user;

--
-- Name: layouts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jacynth_user
--

ALTER SEQUENCE public.layouts_id_seq OWNED BY public.layouts.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: jacynth_user
--

CREATE TABLE public.users (
    id character varying(255) NOT NULL,
    nickname character varying(20)
);


ALTER TABLE public.users OWNER TO jacynth_user;

--
-- Name: users_games; Type: TABLE; Schema: public; Owner: jacynth_user
--

CREATE TABLE public.users_games (
    user_id character varying(255) NOT NULL,
    game_id integer NOT NULL,
    score integer NOT NULL
);


ALTER TABLE public.users_games OWNER TO jacynth_user;

--
-- Name: games id; Type: DEFAULT; Schema: public; Owner: jacynth_user
--

ALTER TABLE ONLY public.games ALTER COLUMN id SET DEFAULT nextval('public.games_id_seq'::regclass);


--
-- Name: layouts id; Type: DEFAULT; Schema: public; Owner: jacynth_user
--

ALTER TABLE ONLY public.layouts ALTER COLUMN id SET DEFAULT nextval('public.layouts_id_seq'::regclass);


--
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: jacynth_user
--

COPY public.games (id, end_time, layout_id) FROM stdin;
26	2021-08-31 01:45:28.975798	3
27	2021-08-31 01:50:46.822845	2
28	2021-09-01 02:42:56.206402	1
29	2021-09-01 02:43:22.384405	1
30	2021-09-01 02:43:29.259149	1
31	2021-09-01 02:43:37.108243	1
32	2021-09-01 02:43:44.290625	1
33	2021-09-01 02:44:01.617974	3
35	2021-09-03 01:49:13.010831	1
37	2021-09-06 12:39:31.714695	3
38	2021-09-12 04:04:13.565712	3
43	2021-09-13 02:48:53.954471	1
44	2021-09-13 05:35:15.122763	2
\.


--
-- Data for Name: layouts; Type: TABLE DATA; Schema: public; Owner: jacynth_user
--

COPY public.layouts (id, name) FROM stdin;
1	razeway
2	towers
3	oldcity
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: jacynth_user
--

COPY public.users (id, nickname) FROM stdin;
easyAI	Easy AI
mediumAI	Medium AI
google-oauth2|112547715685202796160	TestAcct
guest	Guest
google-oauth2|103924212907280004988	Dylan
\.


--
-- Data for Name: users_games; Type: TABLE DATA; Schema: public; Owner: jacynth_user
--

COPY public.users_games (user_id, game_id, score) FROM stdin;
google-oauth2|112547715685202796160	26	3
mediumAI	26	34
guest	27	3
easyAI	27	32
google-oauth2|112547715685202796160	28	31
easyAI	28	21
google-oauth2|112547715685202796160	29	22
easyAI	29	43
google-oauth2|112547715685202796160	30	32
easyAI	30	10
google-oauth2|112547715685202796160	31	32
mediumAI	31	10
google-oauth2|112547715685202796160	32	15
mediumAI	32	34
google-oauth2|112547715685202796160	33	21
mediumAI	33	56
google-oauth2|112547715685202796160	35	22
easyAI	35	22
google-oauth2|112547715685202796160	37	29
mediumAI	37	23
google-oauth2|103924212907280004988	38	7
mediumAI	38	31
google-oauth2|112547715685202796160	43	5
guest	43	6
google-oauth2|112547715685202796160	44	3
guest	44	15
\.


--
-- Name: games_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jacynth_user
--

SELECT pg_catalog.setval('public.games_id_seq', 44, true);


--
-- Name: layouts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jacynth_user
--

SELECT pg_catalog.setval('public.layouts_id_seq', 3, true);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: jacynth_user
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: layouts layouts_pkey; Type: CONSTRAINT; Schema: public; Owner: jacynth_user
--

ALTER TABLE ONLY public.layouts
    ADD CONSTRAINT layouts_pkey PRIMARY KEY (id);


--
-- Name: users users_nickname_key; Type: CONSTRAINT; Schema: public; Owner: jacynth_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_nickname_key UNIQUE (nickname);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: jacynth_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users_games fk_game; Type: FK CONSTRAINT; Schema: public; Owner: jacynth_user
--

ALTER TABLE ONLY public.users_games
    ADD CONSTRAINT fk_game FOREIGN KEY (game_id) REFERENCES public.games(id);


--
-- Name: users_games fk_user; Type: FK CONSTRAINT; Schema: public; Owner: jacynth_user
--

ALTER TABLE ONLY public.users_games
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: games games_fk_layout; Type: FK CONSTRAINT; Schema: public; Owner: jacynth_user
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_fk_layout FOREIGN KEY (layout_id) REFERENCES public.layouts(id);


--
-- PostgreSQL database dump complete
--

